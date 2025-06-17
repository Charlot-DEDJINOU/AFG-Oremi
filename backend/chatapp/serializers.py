# chatapp/serializers.py
from django.utils.encoding import smart_str, force_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework import serializers
from .models import Conversation, Message, Attachment, PromptPreset, LLMConfiguration, TokenUsage, SavedPrompt, User
from .utils import Util

class ExtractCardInfoSerializer(serializers.Serializer):
    url = serializers.URLField(required=False)
    file_type = serializers.CharField(required=False)
    file = serializers.FileField(required=False)
    fileBase64 = serializers.CharField(required=False)
    fileBase64ContentType = serializers.CharField(required=False)
    def validate(self, attrs):
        if not any([attrs.get('url'), attrs.get('file'), attrs.get('fileBase64')]):
            raise serializers.ValidationError("One of 'url', 'file', or 'fileBase64' must be provided.")
        return attrs

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ('id', 'file', 'file_type', 'uploaded_at')

class MessageSerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    class Meta:
        model = Message
        fields = ('id', 'conversation', 'author', 'content', 'order', 'created_at', 'attachments')

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ('id', 'user', 'title', 'use_constraints', 'model_id', 'total_tokens', 'created_at', 'updated_at', 'messages')

class PromptPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptPreset
        fields = ('id', 'title', 'content', 'category', 'variables', 'created_at', 'updated_at')

class LLMConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LLMConfiguration
        fields = ('id', 'name', 'version', 'api_key', 'endpoint', 'config_params', 'created_at', 'updated_at')

class TokenUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TokenUsage
        fields = ('id', 'user', 'conversation', 'tokens_used', 'recorded_at')

class SavedPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPrompt
        fields = ('id', 'user', 'prompt_preset', 'name', 'values', 'context', 'usage_count', 'created_at', 'updated_at')

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'name', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    def create(self, validate_data):
        return User.objects.create_user(**validate_data)

class UserLoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(max_length=255)
    class Meta:
        model = User
        fields = ['email', 'password']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name']

class UserChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=255, write_only=True)
    def validate(self, attrs):
        user = self.context.get('user')
        user.set_password(attrs.get('password'))
        user.save()
        return attrs

class SendPasswordResetEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)
    def validate(self, attrs):
        email = attrs.get('email')
        user = User.objects.filter(email=email).first()
        if not user:
            raise serializers.ValidationError('You are not a Registered User')
        uid = urlsafe_base64_encode(force_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)
        link = f"http://localhost:8000/api/auth/reset-password/{uid}/{token}/"
        Util.send_email({'subject': 'Reset Your Password', 'body': f'Click Here to Reset: {link}', 'to_email': user.email})
        return attrs

class UserPasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=255, write_only=True)
    def validate(self, attrs):
        uid = self.context.get('uid')
        token = self.context.get('token')
        id = smart_str(urlsafe_base64_decode(uid))
        user = User.objects.get(id=id)
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError('Token is not Valid or Expired')
        user.set_password(attrs.get('password'))
        user.save()
        return attrs