import os
import logging
from io import BytesIO
from django.core.mail import EmailMessage
from django.conf import settings

# Pour l'export PDF et Word, il vous faudra installer les librairies reportlab et python-docx :
# pip install reportlab python-docx
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from docx import Document

# Pour l'extraction de texte depuis des fichiers PDF ou images
# pip install PyPDF2 Pillow pytesseract requests
import requests
import PyPDF2
from PIL import Image
import pytesseract

class Util:
    API_URL = 'https://api.ocr.space/parse/image'
    API_KEY = os.environ.get('OCR_SPACE_API_KEY', 'K84258587488957')

    @staticmethod
    def send_email(data):
        """
        Envoie un email en utilisant les données fournies.
        Expects data to contain 'subject', 'body' and 'to_email'.
        """
        email = EmailMessage(
            subject=data.get('subject'),
            body=data.get('body'),
            from_email=os.environ.get('EMAIL_FROM'),
            to=[data.get('to_email')]
        )
        email.send()

    @staticmethod
    def attachment_upload_to(instance, filename):
        """
        Détermine dynamiquement le chemin de sauvegarde pour les fichiers attachés.
        Les fichiers seront stockés dans un dossier spécifique à la conversation.
        """
        return f"attachments/conversation_{instance.message.conversation.id}/{filename}"

    @staticmethod
    def generate_conversation_title(conversation):
        """
        Génère automatiquement un titre pour une conversation à partir
        de la première réponse de l'IA. Si aucun message IA n'est trouvé,
        retourne un titre par défaut.
        """
        ai_messages = conversation.messages.filter(author='ai')
        if ai_messages.exists():
            first_message = ai_messages.first().content
            title = " ".join(first_message.split()[:5])
            return title if title else "Conversation"
        return "Conversation"

    @staticmethod
    def export_conversation_to_pdf(conversation):
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 50
        messages = conversation.messages.order_by('order', 'created_at')
        for message in messages:
            text = f"{message.author.upper()}: {message.content}"
            p.drawString(50, y, text)
            y -= 15
            if y < 50:
                p.showPage()
                y = height - 50
        p.save()
        buffer.seek(0)
        return buffer

    @staticmethod
    def export_conversation_to_word(conversation):
        document = Document()
        messages = conversation.messages.order_by('order', 'created_at')
        for message in messages:
            document.add_paragraph(f"{message.author.upper()}: {message.content}")
        temp_stream = BytesIO()
        document.save(temp_stream)
        temp_stream.seek(0)
        return temp_stream

    @staticmethod
    def ocr_file(file_path):
        """
        Envoie un fichier (image ou PDF) à OCR.Space et retourne le texte extrait.
        """
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {
                'apikey': Util.API_KEY,
                'isOverlayRequired': False,
            }
            resp = requests.post(Util.API_URL, files=files, data=data)
        resp.raise_for_status()
        result = resp.json()
        if result.get('IsErroredOnProcessing'):
            err = result.get('ErrorMessage') or result.get('ErrorDetails')
            raise RuntimeError(f"OCR processing error: {err}")
        text = []
        for parsed in result.get('ParsedResults', []):
            text.append(parsed.get('ParsedText', ''))
        return '\n'.join(text)

    @staticmethod
    def extract_text_from_file(file_path):
        """
        Extrait le texte d'un fichier en fonction de son type.
        Supporte les fichiers texte, PDF et images, utilisant OCR.Space pour un meilleur résultat.
        """
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        text = ""
        if ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        elif ext in ['.pdf', '.jpg', '.jpeg', '.png']:
            try:
                # Utilise l'API OCR.Space pour PDF et images
                text = Util.ocr_file(file_path)
            except Exception as e:
                logging.error(f"Erreur OCR externe pour {file_path}: {e}")
                # Fallback en local
                if ext == '.pdf':
                    try:
                        with open(file_path, 'rb') as f:
                            reader = PyPDF2.PdfReader(f)
                            for page in reader.pages:
                                extracted = page.extract_text()
                                if extracted:
                                    text += extracted + "\n"
                    except Exception as e2:
                        logging.error(f"Erreur lors de l'extraction locale du PDF: {e2}")
                else:
                    try:
                        image = Image.open(file_path)
                        text = pytesseract.image_to_string(image)
                    except Exception as e2:
                        logging.error(f"Erreur lors de l'extraction locale de l'image: {e2}")
        else:
            logging.warning("Format de fichier non supporté pour l'extraction de texte.")
        return text

    @staticmethod
    def calculate_token_usage(conversation):
        total_tokens = 0
        for message in conversation.messages.all():
            total_tokens += len(message.content.split())
        return total_tokens

    @staticmethod
    def stream_response_generator(generator):
        for token in generator:
            yield token
