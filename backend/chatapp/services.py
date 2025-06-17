import threading
import queue
import os
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

class ChatService:
    """
    Service orchestrant l'appel au LLM via LangChain.
    - Gère la sélection du modèle (ici OpenAI avec ChatOpenAI)
    - Construit le prompt en intégrant un template et l'historique de conversation
    - Lance la génération en streaming et retourne un générateur de tokens
    """
    
    def __init__(self, model_name: str = "gpt-3.5-turbo", temperature: float = 0.7):
        self.model_name = model_name
        self.temperature = temperature

    def build_prompt(self, user_prompt: str, history: list = None, preset_prompt: str = None) -> str:
        """
        Construit le prompt final en combinant :
          - Le contenu d'un prompt préenregistré (optionnel)
          - L'historique de conversation (optionnel)
          - Le prompt saisi par l'utilisateur
        """
        # Si un preset est fourni, on peut utiliser un template
        if preset_prompt:
            template = PromptTemplate(
                input_variables=["sujet"],
                template=preset_prompt  # Ex: "Ecris une introduction engageante sur le sujet suivant : {sujet}"
            )
            # On suppose ici que le user_prompt correspond à la valeur du placeholder "sujet"
            prompt_text = template.format(sujet=user_prompt)
        else:
            prompt_text = user_prompt
        
        # Si de l'historique est présent, on l'intègre au prompt
        if history:
            # Concaténer les messages en indiquant l'auteur pour chaque message
            history_text = "\n".join(f"{msg['author']}: {msg['content']}" for msg in history)
            full_prompt = f"Historique de la conversation:\n{history_text}\n\nUser: {prompt_text}\nAI:"
        else:
            full_prompt = f"User: {prompt_text}\nAI:"
        
        return full_prompt

    def generate_response_stream(self, user_prompt: str, history: list = None, preset_prompt: str = None):
        """
        Lance la génération de réponse en streaming.
        Retourne un générateur qui yield les tokens dès qu'ils sont produits.
        
        Paramètres:
          - user_prompt: Le prompt saisi par l'utilisateur ou le contenu à générer
          - history: Liste de dictionnaires représentant l'historique (ex: [{"author": "user", "content": "Bonjour"}, ...])
          - preset_prompt: Un prompt préenregistré contenant éventuellement un placeholder (ex: {sujet})
        """
        # Construire le prompt final
        final_prompt = self.build_prompt(user_prompt, history, preset_prompt)
        
        # Instancier notre callback pour le streaming
        callback_handler = StreamingCallbackHandler()
        
        # Instancier le LLM avec streaming activé
        llm = ChatOpenAI(
            model_name=self.model_name,
            temperature=self.temperature,
            streaming=True,
            callbacks=[callback_handler],
            openai_api_key=os.environ.get("OPENAI_API_KEY")
        )
        
        # Pour éviter de bloquer le thread principal (celui qui va streamer la réponse),
        # on lance l'appel dans un thread séparé.
        def run_llm():
            # L'appel à l'LLM va déclencher notre callback pour chaque token généré.
            _ = llm(final_prompt)
        
        thread = threading.Thread(target=run_llm)
        thread.start()

        # Le générateur lit dans la queue tant que le streaming n'est pas terminé
        def token_generator():
            while True:
                token = callback_handler.token_queue.get()
                if token is None:  # Fin du streaming
                    break
                yield token
        
        return token_generator()
