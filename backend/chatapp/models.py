from django.db import models
from django.contrib.auth.models import BaseUserManager,AbstractBaseUser
import os
import uuid

from chatapp.utils import Util


#  Custom User Manager
class UserManager(BaseUserManager):
  def create_user(self, email, name, password=None):
      """
      Creates and saves a User with the given email, name and password.
      """
      if not email:
          raise ValueError('User must have an email address')

      user = self.model(
          email=self.normalize_email(email),
          name=name,
      )

      user.set_password(password)
      user.save(using=self._db)
      return user

  def create_superuser(self, email, name, password=None):
      """
      Creates and saves a superuser with the given email, name and password.
      """
      user = self.create_user(
          email,
          password=password,
          name=name,
      )
      user.is_admin = True
      user.save(using=self._db)
      return user

#  Custom User Model
class User(AbstractBaseUser):
  email = models.EmailField(
      verbose_name='Email',
      max_length=255,
      unique=True,
  )
  name = models.CharField(max_length=200)
  is_active = models.BooleanField(default=True)
  is_admin = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  objects = UserManager()

  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = ['name']

  def __str__(self):
      return self.email

  def has_perm(self, perm, obj=None):
      "Does the user have a specific permission?"
      # Simplest possible answer: Yes, always
      return self.is_admin

  def has_module_perms(self, app_label):
      "Does the user have permissions to view the app `app_label`?"
      # Simplest possible answer: Yes, always
      return True

  @property
  def is_staff(self):
      "Is the user a member of staff?"
      # Simplest possible answer: All admins are staff
      return self.is_admin






def attachment_upload_to(instance, filename):
    """
    Détermine dynamiquement le chemin de sauvegarde des fichiers attachés.
    Les fichiers seront stockés dans un dossier associé à l'ID de la conversation.
    """
    return f"attachments/conversation_{instance.message.conversation.id}/{filename}"


class Conversation(models.Model):
    """
    Regroupe l'ensemble des échanges entre un utilisateur et l'IA.
    Cette table stocke les informations globales de la conversation (titre, date, modèle sélectionné, etc.).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Ajouté
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255, blank=True, null=True)
    use_constraints = models.BooleanField(default=False, help_text="Indique si les contraintes de rédaction sont appliquées.")
    model_id = models.CharField(max_length=100, blank=True, null=True, help_text="Identifiant du modèle LLM sélectionné.")
    total_tokens = models.PositiveIntegerField(default=0, help_text="Total des tokens utilisés pour la conversation.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or f"Conversation {self.pk} - {self.user.name}"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Ajouté
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    AUTHOR_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    )
    author = models.CharField(max_length=20, choices=AUTHOR_CHOICES)
    content = models.TextField()
    order = models.PositiveIntegerField(default=0, help_text="Champ pour gérer l'ordre d'affichage des messages.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.author.capitalize()} - {self.pk}"



class Attachment(models.Model):
    """
    Gère les fichiers attachés aux messages (images, documents, etc.).
    Le champ 'file' utilise la fonction 'attachment_upload_to' pour définir le chemin de stockage.
    """
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=attachment_upload_to)
    file_type = models.CharField(max_length=50, blank=True, null=True, help_text="Type de fichier (ex: image, document).")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment {self.pk} for Message {self.message.pk}"


class PromptPreset(models.Model):
    """
    Stocke les prompts préenregistrés que les utilisateurs peuvent sélectionner et compléter.
    Le champ 'variables' permet de conserver la liste des espaces réservés (ex: [sujet]) sous forme de JSON.
    """
    title = models.CharField(max_length=255)
    content = models.TextField(help_text="Contenu du prompt avec des espaces réservés si nécessaire.")
    category = models.CharField(max_length=100, blank=True, null=True)
    variables = models.JSONField(blank=True, null=True, help_text="Liste des variables du prompt.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class LLMConfiguration(models.Model):
    """
    Gère la configuration des modèles de langage disponibles.
    Permet de stocker des informations telles que le nom, la version, l'API key et d'autres paramètres.
    """
    name = models.CharField(max_length=100, help_text="Nom du modèle (ex: ChatGPT, Claude, Mistral).")
    version = models.CharField(max_length=50)
    api_key = models.CharField(max_length=255, blank=True, null=True)
    endpoint = models.URLField(blank=True, null=True)
    config_params = models.JSONField(blank=True, null=True, help_text="Paramètres complémentaires du modèle.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} v{self.version}"


class TokenUsage(models.Model):
    """
    Suit la consommation de tokens par utilisateur et par conversation.
    Utile pour le reporting et la facturation.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='token_usages')
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='token_usages', blank=True, null=True)
    tokens_used = models.PositiveIntegerField(default=0)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name} - {self.tokens_used} tokens on {self.recorded_at.date()}"


class SavedPrompt(models.Model):
    """
    Permet aux utilisateurs de sauvegarder leurs propres prompts personnalisés,
    basés sur un prompt préenregistré (ou indépendants) avec des valeurs spécifiques.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_prompts')
    prompt_preset = models.ForeignKey(PromptPreset, on_delete=models.SET_NULL, null=True, blank=True, related_name='saved_prompts')
    name = models.CharField(max_length=255, help_text="Nom personnalisé pour le prompt sauvegardé.")
    values = models.JSONField(help_text="Mapping des variables et leurs valeurs.", default=dict)
    context = models.JSONField(blank=True, null=True, help_text="Contexte supplémentaire pour le prompt.")
    usage_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
