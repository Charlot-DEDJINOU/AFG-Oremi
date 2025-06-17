

# chatapp/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserRegistrationView, UserLoginView, UserProfileView, UserChangePasswordView, SendPasswordResetEmailView, UserPasswordResetView, ConversationViewSet, MessageViewSet, AttachmentViewSet, PromptPresetViewSet, LLMConfigurationViewSet, TokenUsageViewSet, SavedPromptViewSet, ChatGenerateView, ExtractCardInfoViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'prompt-presets', PromptPresetViewSet, basename='prompt-preset')
router.register(r'llm-configs', LLMConfigurationViewSet, basename='llm-configuration')
router.register(r'token-usages', TokenUsageViewSet, basename='token-usage')
router.register(r'saved-prompts', SavedPromptViewSet, basename='saved-prompt')
router.register(r'cards/extract', ExtractCardInfoViewSet, basename='card-extract')

urlpatterns = [
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    path('auth/profile/', UserProfileView.as_view(), name='profile'),
    path('auth/changepassword/', UserChangePasswordView.as_view(), name='changepassword'),
    path('auth/send-reset-password-email/', SendPasswordResetEmailView.as_view(), name='send-reset-password-email'),
    path('auth/reset-password/<uid>/<token>/', UserPasswordResetView.as_view(), name='reset-password'),
    path('chat/message/generate/', ChatGenerateView.as_view(), name='chat-generate'),
    path('', include(router.urls)),
]
