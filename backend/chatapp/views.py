from uuid import uuid4

from django.contrib.auth import authenticate
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Attachment,
    Conversation,
    LLMConfiguration,
    Message,
    PromptPreset,
    SavedPrompt,
    TokenUsage,
)
from .renderers import UserRenderer
from .serializers import (
    AttachmentSerializer,
    ConversationSerializer,
    LLMConfigurationSerializer,
    MessageSerializer,
    PromptPresetSerializer,
    SavedPromptSerializer,
    TokenUsageSerializer,
    UserChangePasswordSerializer,
    UserLoginSerializer,
    UserPasswordResetSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    SendPasswordResetEmailSerializer,
)
from .utils import Util
from .chat_handler import ChatHandler


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ----------------------
# User Authentication
# ----------------------
class UserRegistrationView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = get_tokens_for_user(user)
        return Response({'token': token, 'msg': 'Registration Success'},
                        status=status.HTTP_201_CREATED)


class UserLoginView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(email=email, password=password)

        if not user:
            return Response(
                {'errors': {'non_field_errors': ['Invalid email or password']}},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = get_tokens_for_user(user)
        user_data = {"id": user.id, "email": user.email, "name": user.name}
        return Response({'token': token, 'msg': 'Login Success', 'user': user_data},
                        status=status.HTTP_200_OK)


class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserChangePasswordView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = UserChangePasswordSerializer(
            data=request.data,
            context={'user': request.user}
        )
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password Changed Successfully'},
                        status=status.HTTP_200_OK)


class SendPasswordResetEmailView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = SendPasswordResetEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password reset link sent. Check your email.'},
                        status=status.HTTP_200_OK)


class UserPasswordResetView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, uid, token, format=None):
        serializer = UserPasswordResetSerializer(
            data=request.data,
            context={'uid': uid, 'token': token}
        )
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password Reset Successfully'},
                        status=status.HTTP_200_OK)


# ----------------------
# Prompt & LLM Config
# ----------------------
class PromptPresetViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromptPreset.objects.all()
    serializer_class = PromptPresetSerializer


class LLMConfigurationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LLMConfiguration.objects.all()
    serializer_class = LLMConfigurationSerializer


# ----------------------
# Chat Generation
# ----------------------
class ChatGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        content = data.get('content')
        if not content:
            return self.error_response("Message content is required", "validation",
                                       status.HTTP_400_BAD_REQUEST)

        chat_id = data.get('chatId')
        conversation = None
        if chat_id:
            try:
                conversation = Conversation.objects.filter(
                    id=chat_id, user=request.user
                ).first()
            except ValidationError:
                conversation = None

        with transaction.atomic():
            if not conversation:
                chat_id = chat_id or str(uuid4())
                conversation = Conversation.objects.create(
                    id=chat_id,
                    user=request.user,
                    title=data.get('chatTitle', 'New Conversation'),
                    model_id=data.get('modelId', 'llama'),
                    use_constraints=data.get('useConstraints', False),
                )
                Message.objects.create(
                    conversation=conversation,
                    author='system',
                    content='System initialized.',
                    order=0,
                    created_at=timezone.now()
                )

            # Determine order
            last = conversation.messages.order_by('-order').first()
            order = last.order + 1 if last else 1

            # Handle edits or new user message
            edit_id = data.get('editMessageId')
            create_id = data.get('createMessageId')
            if edit_id:
                user_msg = Message.objects.filter(
                    id=edit_id, conversation=conversation, author='user'
                ).first()
                if user_msg:
                    user_msg.content = content
                    user_msg.save()
                    Message.objects.filter(
                        conversation=conversation, order__gt=user_msg.order
                    ).delete()
                    order = user_msg.order + 1
                else:
                    Message.objects.create(
                        id=create_id or str(uuid4()),
                        conversation=conversation,
                        author='user',
                        content=content,
                        order=order,
                        created_at=timezone.now()
                    )
                    order += 1
            elif create_id:
                try:
                    Message.objects.create(
                        id=create_id,
                        conversation=conversation,
                        author='user',
                        content=content,
                        order=order,
                        created_at=timezone.now()
                    )
                    order += 1
                except IntegrityError:
                    pass

            # Prepare assistant message
            msg_id = None
            msgs = data.get('messages', [])
            if msgs:
                msg_id = msgs[-1].get('id')

            if msg_id:
                assistant_msg, created = Message.objects.get_or_create(
                    id=msg_id,
                    defaults={'conversation': conversation,
                              'author': 'assistant',
                              'content': '',
                              'order': order,
                              'created_at': timezone.now()}
                )
                if not created:
                    assistant_msg.order = order
                    assistant_msg.save()
            else:
                assistant_msg = Message.objects.create(
                    conversation=conversation,
                    author='assistant',
                    content='',
                    order=order,
                    created_at=timezone.now()
                )

        # Streaming response
        data['chatId'] = conversation.id
        data['messages'] = list(
            conversation.messages.values('id', 'author', 'content', 'order')
        )
        try:
            handler = ChatHandler()
            stream = handler.generate_response(data)

            def error_gen():
                try:
                    yield from stream
                except Exception as e:
                    yield json.dumps({
                        'error': True,
                        'message': str(e),
                        'type': 'generation',
                        'status': 500,
                        'details': traceback.format_exc()
                    })

            return StreamingHttpResponse(
                error_gen(),
                content_type='text/plain; charset=utf-8'
            )
        except Exception as e:
            return self.error_response(
                f"Generation init error: {e}", 'generation',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                traceback.format_exc()
            )

    def error_response(self, message, error_type, status_code, details=None):
        resp = {
            'error': True,
            'message': message,
            'type': error_type,
            'status': status_code,
        }
        if details and (self.request.user.is_staff or settings.DEBUG):
            resp['details'] = details
        return JsonResponse(resp, status=status_code)


# ----------------------
# Conversation & Messages
# ----------------------
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(user=user) if user.is_authenticated else Conversation.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        convo = self.get_object()
        pdf = Util.export_conversation_to_pdf(convo)
        resp = HttpResponse(pdf, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="conversation_{convo.id}.pdf"'
        return resp

    @action(detail=True, methods=['get'])
    def export_word(self, request, pk=None):
        convo = self.get_object()
        doc = Util.export_conversation_to_word(convo)
        resp = HttpResponse(
            doc,
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        resp['Content-Disposition'] = f'attachment; filename="conversation_{convo.id}.docx"'
        return resp


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Message.objects.none()
        conv_id = self.request.query_params.get('conversation')
        base_qs = Message.objects.filter(conversation__user=user)
        return base_qs.filter(conversation__id=conv_id) if conv_id else base_qs

    def partial_update(self, request, *args, **kwargs):
        with transaction.atomic():
            return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        with transaction.atomic():
            msg = self.get_object()
            conv = msg.conversation
            deleted, _ = Message.objects.filter(
                conversation=conv, order__gte=msg.order
            ).delete()
            return Response({'deleted': deleted}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        msg = self.get_object()
        if msg.author != 'user':
            return Response(
                {"detail": "Only user messages can regenerate."},
                status=status.HTTP_400_BAD_REQUEST
            )
        new = Message.objects.create(
            conversation=msg.conversation,
            author='assistant',
            content=f"Regenerated for: {msg.content}",
            order=msg.order + 1
        )
        return Response(MessageSerializer(new).data, status=status.HTTP_201_CREATED)


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        user = self.request.user
        return Attachment.objects.filter(message__conversation__user=user) if user.is_authenticated else Attachment.objects.none()


class TokenUsageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TokenUsageSerializer

    def get_queryset(self):
        user = self.request.user
        return TokenUsage.objects.filter(user=user) if user.is_authenticated else TokenUsage.objects.none()


class SavedPromptViewSet(viewsets.ModelViewSet):
    serializer_class = SavedPromptSerializer

    def get_queryset(self):
        user = self.request.user
        return SavedPrompt.objects.filter(user=user) if user.is_authenticated else SavedPrompt.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)







########################"abs
# OCR "

from uuid import uuid4

from django.contrib.auth import authenticate
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Attachment,
    Conversation,
    LLMConfiguration,
    Message,
    PromptPreset,
    SavedPrompt,
    TokenUsage,
)
from .renderers import UserRenderer
from .serializers import (
    AttachmentSerializer,
    ConversationSerializer,
    LLMConfigurationSerializer,
    MessageSerializer,
    PromptPresetSerializer,
    SavedPromptSerializer,
    TokenUsageSerializer,
    UserChangePasswordSerializer,
    UserLoginSerializer,
    UserPasswordResetSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    SendPasswordResetEmailSerializer,
)
from .utils import Util
from .chat_handler import ChatHandler


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# ----------------------
# User Authentication
# ----------------------
class UserRegistrationView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = get_tokens_for_user(user)
        return Response({'token': token, 'msg': 'Registration Success'},
                        status=status.HTTP_201_CREATED)


class UserLoginView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(email=email, password=password)

        if not user:
            return Response(
                {'errors': {'non_field_errors': ['Invalid email or password']}},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = get_tokens_for_user(user)
        user_data = {"id": user.id, "email": user.email, "name": user.name}
        return Response({'token': token, 'msg': 'Login Success', 'user': user_data},
                        status=status.HTTP_200_OK)


class UserProfileView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserChangePasswordView(APIView):
    renderer_classes = [UserRenderer]
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = UserChangePasswordSerializer(
            data=request.data,
            context={'user': request.user}
        )
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password Changed Successfully'},
                        status=status.HTTP_200_OK)


class SendPasswordResetEmailView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, format=None):
        serializer = SendPasswordResetEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password reset link sent. Check your email.'},
                        status=status.HTTP_200_OK)


class UserPasswordResetView(APIView):
    renderer_classes = [UserRenderer]

    def post(self, request, uid, token, format=None):
        serializer = UserPasswordResetSerializer(
            data=request.data,
            context={'uid': uid, 'token': token}
        )
        serializer.is_valid(raise_exception=True)
        return Response({'msg': 'Password Reset Successfully'},
                        status=status.HTTP_200_OK)


# ----------------------
# Prompt & LLM Config
# ----------------------
class PromptPresetViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromptPreset.objects.all()
    serializer_class = PromptPresetSerializer


class LLMConfigurationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LLMConfiguration.objects.all()
    serializer_class = LLMConfigurationSerializer


# ----------------------
# Chat Generation
# ----------------------
class ChatGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        content = data.get('content')
        if not content:
            return self.error_response("Message content is required", "validation",
                                       status.HTTP_400_BAD_REQUEST)

        chat_id = data.get('chatId')
        conversation = None
        if chat_id:
            try:
                conversation = Conversation.objects.filter(
                    id=chat_id, user=request.user
                ).first()
            except ValidationError:
                conversation = None

        with transaction.atomic():
            if not conversation:
                chat_id = chat_id or str(uuid4())
                conversation = Conversation.objects.create(
                    id=chat_id,
                    user=request.user,
                    title=data.get('chatTitle', 'New Conversation'),
                    model_id=data.get('modelId', 'llama'),
                    use_constraints=data.get('useConstraints', False),
                )
                Message.objects.create(
                    conversation=conversation,
                    author='system',
                    content='System initialized.',
                    order=0,
                    created_at=timezone.now()
                )

            # Determine order
            last = conversation.messages.order_by('-order').first()
            order = last.order + 1 if last else 1

            # Handle edits or new user message
            edit_id = data.get('editMessageId')
            create_id = data.get('createMessageId')
            if edit_id:
                user_msg = Message.objects.filter(
                    id=edit_id, conversation=conversation, author='user'
                ).first()
                if user_msg:
                    user_msg.content = content
                    user_msg.save()
                    Message.objects.filter(
                        conversation=conversation, order__gt=user_msg.order
                    ).delete()
                    order = user_msg.order + 1
                else:
                    Message.objects.create(
                        id=create_id or str(uuid4()),
                        conversation=conversation,
                        author='user',
                        content=content,
                        order=order,
                        created_at=timezone.now()
                    )
                    order += 1
            elif create_id:
                try:
                    Message.objects.create(
                        id=create_id,
                        conversation=conversation,
                        author='user',
                        content=content,
                        order=order,
                        created_at=timezone.now()
                    )
                    order += 1
                except IntegrityError:
                    pass

            # Prepare assistant message
            msg_id = None
            msgs = data.get('messages', [])
            if msgs:
                msg_id = msgs[-1].get('id')

            if msg_id:
                assistant_msg, created = Message.objects.get_or_create(
                    id=msg_id,
                    defaults={'conversation': conversation,
                              'author': 'assistant',
                              'content': '',
                              'order': order,
                              'created_at': timezone.now()}
                )
                if not created:
                    assistant_msg.order = order
                    assistant_msg.save()
            else:
                assistant_msg = Message.objects.create(
                    conversation=conversation,
                    author='assistant',
                    content='',
                    order=order,
                    created_at=timezone.now()
                )

        # Streaming response
        data['chatId'] = conversation.id
        data['messages'] = list(
            conversation.messages.values('id', 'author', 'content', 'order')
        )
        try:
            handler = ChatHandler()
            stream = handler.generate_response(data)

            def error_gen():
                try:
                    yield from stream
                except Exception as e:
                    yield json.dumps({
                        'error': True,
                        'message': str(e),
                        'type': 'generation',
                        'status': 500,
                        'details': traceback.format_exc()
                    })

            return StreamingHttpResponse(
                error_gen(),
                content_type='text/plain; charset=utf-8'
            )
        except Exception as e:
            return self.error_response(
                f"Generation init error: {e}", 'generation',
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                traceback.format_exc()
            )

    def error_response(self, message, error_type, status_code, details=None):
        resp = {
            'error': True,
            'message': message,
            'type': error_type,
            'status': status_code,
        }
        if details and (self.request.user.is_staff or settings.DEBUG):
            resp['details'] = details
        return JsonResponse(resp, status=status_code)


# ----------------------
# Conversation & Messages
# ----------------------
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(user=user) if user.is_authenticated else Conversation.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        convo = self.get_object()
        pdf = Util.export_conversation_to_pdf(convo)
        resp = HttpResponse(pdf, content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="conversation_{convo.id}.pdf"'
        return resp

    @action(detail=True, methods=['get'])
    def export_word(self, request, pk=None):
        convo = self.get_object()
        doc = Util.export_conversation_to_word(convo)
        resp = HttpResponse(
            doc,
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        resp['Content-Disposition'] = f'attachment; filename="conversation_{convo.id}.docx"'
        return resp


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Message.objects.none()
        conv_id = self.request.query_params.get('conversation')
        base_qs = Message.objects.filter(conversation__user=user)
        return base_qs.filter(conversation__id=conv_id) if conv_id else base_qs

    def partial_update(self, request, *args, **kwargs):
        with transaction.atomic():
            return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        with transaction.atomic():
            msg = self.get_object()
            conv = msg.conversation
            deleted, _ = Message.objects.filter(
                conversation=conv, order__gte=msg.order
            ).delete()
            return Response({'deleted': deleted}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        msg = self.get_object()
        if msg.author != 'user':
            return Response(
                {"detail": "Only user messages can regenerate."},
                status=status.HTTP_400_BAD_REQUEST
            )
        new = Message.objects.create(
            conversation=msg.conversation,
            author='assistant',
            content=f"Regenerated for: {msg.content}",
            order=msg.order + 1
        )
        return Response(MessageSerializer(new).data, status=status.HTTP_201_CREATED)


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        user = self.request.user
        return Attachment.objects.filter(message__conversation__user=user) if user.is_authenticated else Attachment.objects.none()


class TokenUsageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TokenUsageSerializer

    def get_queryset(self):
        user = self.request.user
        return TokenUsage.objects.filter(user=user) if user.is_authenticated else TokenUsage.objects.none()


class SavedPromptViewSet(viewsets.ModelViewSet):
    serializer_class = SavedPromptSerializer

    def get_queryset(self):
        user = self.request.user
        return SavedPrompt.objects.filter(user=user) if user.is_authenticated else SavedPrompt.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)







########################"abs
# OCR "

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


from io import BytesIO
from pdf2image import convert_from_bytes
from easyocr import Reader
from langchain_core.output_parsers.json import JsonOutputParser
from langchain_core.prompts import PromptTemplate
import os
import base64
import requests
import mimetypes
import tempfile
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import ExtractCardInfoSerializer
from .chat_handler import ChatHandler
from .utils import Util
from langchain_core.output_parsers.json import JsonOutputParser
from langchain_core.prompts import PromptTemplate


# JSON schema for French vehicle registration card
CARD_SCHEMA = {
    "type": "object",
    "properties": {
        "immatriculation": {"type": "string"},
        "datePremiereImmatriculation": {"type": "string", "format": "date"},
        "numeroFormule": {"type": "string"},
        "codeType": {"type": "string"},
        "designationCommerciale": {"type": "string"},
        "marque": {"type": "string"},
        "modele": {"type": "string"},
        "varianteVersion": {"type": "string"},
        "genreVehicule": {"type": "string"},
        "carrosserie": {"type": "string"},
        "carburant": {"type": "string"},
        "energie": {"type": "string"},
        "puissanceFiscale": {"type": "integer"},
        "puissanceDIN": {"type": "integer"},
        "cylindree": {"type": "integer"},
        "masseEnChargeMaxAutorisee": {"type": "integer"},
        "poidsÀVide": {"type": "integer"},
        "ptac": {"type": "integer"},
        "ptacRemorque": {"type": "integer"},
        "nombrePlacesAssises": {"type": "integer"},
        "couleur": {"type": "string"},
        "numeroVIN": {"type": "string"},
        "immatriculationPrecedente": {"type": ["string", "null"]},
        "titulaire": {
            "type": "object",
            "properties": {
                "nom": {"type": "string"},
                "prenom": {"type": "string"},
                "adresse": {
                    "type": "object",
                    "properties": {
                        "numero": {"type": "string"},
                        "rue": {"type": "string"},
                        "codePostal": {"type": "string"},
                        "ville": {"type": "string"}
                    },
                    "required": ["numero", "rue", "codePostal", "ville"]
                }
            },
            "required": ["nom", "prenom", "adresse"]
        },
        "coTitulaire": {"type": ["object", "null"]},
        "statutProprietaire": {"type": "string"},
        "typeCertificat": {"type": "string"},
        "dateValiditeCertificat": {"type": "string", "format": "date"},
        "observations": {"type": ["string", "null"]}
    },
    "required": [
        "immatriculation",
        "datePremiereImmatriculation",
        "numeroFormule",
        "titulaire"
    ]
}



# Initialisation du parser JSON
parser = JsonOutputParser(diff=False)
format_instructions = parser.get_format_instructions()

# Prompt optimisé
PROMPT = PromptTemplate(
    input_variables=["format_instructions", "text"],
    template=(
        """Tu es un assistant expert en extraction de données depuis le texte OCR d’une carte grise.
        Objectif : repérer et normaliser un maximum d’informations, puis renvoyer strictement un JSON
        contenant *exactement* les clefs suivantes (mettre "" si la donnée est absente) :

        - immatriculation  
        - datePremiereImmatriculation  
        - numeroFormule  
        - codeType  
        - designationCommerciale  
        - marque  
        - modele  
        - varianteVersion  
        - genreVehicule  
        - carrosserie  
        - carburant  
        - energie  
        - puissanceFiscale  
        - puissanceDIN  
        - cylindree  
        - masseEnChargeMaxAutorisee  
        - poidsÀVide  
        - ptac  
        - ptacRemorque  
        - nombrePlacesAssises  
        - couleur  
        - numeroVIN  
        - immatriculationPrecedente  
        - titulaire_nom  
        - titulaire_prenom  
        - titulaire_adresse_numero  
        - titulaire_adresse_rue  
        - titulaire_adresse_codePostal  
        - titulaire_adresse_ville  
        - coTitulaire_nom  
        - coTitulaire_prenom  
        - coTitulaire_adresse_numero  
        - coTitulaire_adresse_rue  
        - coTitulaire_adresse_codePostal  
        - coTitulaire_adresse_ville  
        - statutProprietaire  
        - typeCertificat  
        - dateValiditeCertificat  
        - observations  

        Instructions :
        1. Analyse chaque ligne du texte OCR, y compris les libellés et abréviations.  
        2. Détecte les synonymes (ex. « genre » vs « type », « PTAC » vs « masse en charge »).  
        3. Normalise tous les formats :  
        - Dates en JJ/MM/AAAA  
        - Poids en kg  
        - Puissances en CV ou kW selon le contexte  
        4. Remplis chaque clef du JSON, même vide.  
        5. Ne renvoie **que** l’objet JSON valide, sans aucun commentaire.

        {format_instructions}

        Texte OCR à traiter :
        {text}"""
    )
)


import os

# views.py
from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .serializers import ExtractCardInfoSerializer
from .utils import Util
import tempfile, os, requests, base64, mimetypes

# JSON parser and templates
parser = JsonOutputParser(diff=False)
format_instructions = parser.get_format_instructions()

# Prompt for vehicle registration card (carte grise)
PROMPT_GRIS = """
Tu es un assistant expert en extraction de données depuis le texte OCR d’une carte grise.
Objectif : repérer et normaliser un maximum d’informations, puis renvoyer strictement un JSON
contenant *exactement* les clefs suivantes (mettre "" si la donnée est absente) :

- immatriculation
- datePremiereImmatriculation
- numeroFormule
- codeType
- designationCommerciale
- marque
- modele
- varianteVersion
- genreVehicule
- carrosserie
- carburant
- energie
- puissanceFiscale
- puissanceDIN
- cylindree
- masseEnChargeMaxAutorisee
- poidsÀVide
- ptac
- ptacRemorque
- nombrePlacesAssises
- couleur
- numeroVIN
- immatriculationPrecedente
- titulaire_nom
- titulaire_prenom
- titulaire_adresse_numero
- titulaire_adresse_rue
- titulaire_adresse_codePostal
- titulaire_adresse_ville
- coTitulaire_nom
- coTitulaire_prenom
- coTitulaire_adresse_numero
- coTitulaire_adresse_rue
- coTitulaire_adresse_codePostal
- coTitulaire_adresse_ville
- statutProprietaire
- typeCertificat
- dateValiditeCertificat
- observations

Instructions :
1. Analyse chaque ligne du texte OCR, y compris les libellés et abréviations.
2. Détecte les synonymes (ex. « genre » vs « type », « PTAC » vs « masse en charge »).
3. Normalise tous les formats :
   - Dates en JJ/MM/AAAA
   - Poids en kg
   - Puissances en CV ou kW selon le contexte
4. Remplis chaque clef du JSON, même vide.
5. Ne renvoie **que** l’objet JSON valide, sans aucun commentaire.

{format_instructions}

Texte OCR à traiter :
{text}"""

# Prompt for driver’s license (permis de conduire)
PROMPT_PERMIS = """
Tu es un assistant expert en extraction de données depuis le texte OCR d’un permis de conduire.
Objectif : repérer et normaliser un maximum d’informations du permis, puis renvoyer strictement un JSON
contenant *exactement* les clefs suivantes (mettre "" si la donnée est absente) :

- numeroPermis
- categorie
- dateDelivrance
- dateExpiration
- titulaire_nom
- titulaire_prenom
- dateNaissance
- lieuNaissance
- lieuDelivrance
- numeroPermisPrecedent
- observations

Instructions :
1. Analyse chaque ligne, y compris les abréviations (ex. "N° législation" pour catégorie).
2. Normalise les dates en JJ/MM/AAAA.
3. Vérifie la cohérence des catégories (A, B, C, D, etc.).
4. Ne renvoie **que** l’objet JSON valide, sans aucun texte additionnel.

{format_instructions}

Texte OCR à traiter :
{text}"""

# Prompt for ID card or passport (CIP, passport, other)
PROMPT_ID = """
Tu es un assistant expert en extraction de données depuis le texte OCR d’une carte d’identité ou d’un passeport.
Objectif : repérer et normaliser un maximum d’informations, puis renvoyer strictement un JSON
contenant *exactement* les clefs suivantes (mettre "" si la donnée est absente) :

- typeDocument
- numeroDocument
- titulaire_nom
- titulaire_prenom
- dateNaissance
- lieuNaissance
- sexe
- nationalite
- dateDelivrance
- lieuDelivrance
- dateExpiration
- observations

Instructions :
1. Identifie le type de document (CIP, passeport, autre).
2. Analyse chaque champ (libellés CIP, MRZ, etc.).
3. Normalise les dates en JJ/MM/AAAA.
4. Ne renvoie **que** l’objet JSON valide, sans aucun commentaire.

{format_instructions}

Texte OCR à traiter :
{text}"""


class ExtractCardInfoViewSet(viewsets.ViewSet):
    """
    ViewSet for extracting document info via OCR and LLM.
    Supported types:
      - grise_card (Carte grise)
      - permis (Permis de conduire)
      - id_card (Carte d’identité / Passeport)
    """
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = ExtractCardInfoSerializer

    def _save_temp_file(self, data):
        """Save uploaded or fetched file to a temp file."""
        url = data.get('url')
        upload = data.get('file')
        b64 = data.get('fileBase64')
        content_type = data.get('fileBase64ContentType')
        if not (url or upload or b64):
            raise ValueError('No file provided')
        tmp = None
        if url:
            resp = requests.get(url)
            if resp.status_code != 200:
                raise ValueError('Cannot download document')
            ext = os.path.splitext(url)[1]
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            tmp.write(resp.content)
        elif upload:
            ext = os.path.splitext(upload.name)[1]
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            for chunk in upload.chunks():
                tmp.write(chunk)
        else:
            decoded = base64.b64decode(b64)
            ext = mimetypes.guess_extension(content_type) or ''
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
            tmp.write(decoded)
        tmp.flush()
        return tmp

    def _extract_and_parse(self, tmp_file, prompt_template):
        """Run OCR and LLM parsing pipeline with chosen prompt."""
        try:
            text = Util.extract_text_from_file(tmp_file.name)
        finally:
            tmp_file.close()
        prompt = prompt_template.format(
            format_instructions=format_instructions,
            text=text
        )
        handler = ChatHandler()
        stream = handler.generate_response({
            'messages': [],
            'content': prompt,
            'modelId': 'llama',
            'temperature': 0.9,
            'maxTokens': 1024
        })
        output = ''.join(token for token in stream)
        return parser.parse(output)

    def create(self, request):
        """Extract info based on provided document type."""
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        doc_type = data.get('file_type')  # Expected: 'grise_card', 'permis', or 'id_card'
        prompts = {
            'grise_card': PROMPT_GRIS,
            'permis': PROMPT_PERMIS,
            'id_card': PROMPT_ID
        }
        template = prompts.get(doc_type)
        if not template:
            return Response({'error': 'Type de document invalide'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tmp_file = self._save_temp_file(data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        parsed = self._extract_and_parse(tmp_file, template)
        return Response(parsed, status=status.HTTP_200_OK)
