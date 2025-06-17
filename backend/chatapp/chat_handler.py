import os
import json
import queue
import threading
import logging
import traceback
import time
from typing import Dict, Any, Generator, Optional

# Import des composants de LangChain
from langchain.schema import HumanMessage, SystemMessage
from langchain.callbacks.base import BaseCallbackHandler
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

# Callback personnalisé pour le streaming
class StreamingCallbackHandler(BaseCallbackHandler):
    """
    Callback handler qui place chaque token généré dans une file d'attente.
    Une fois la génération terminée, un sentinel (None) est placé pour signaler la fin.
    """
    def __init__(self):
        self.queue = queue.Queue()
        self.done = False

    def on_llm_new_token(self, token: str, **kwargs):
        self.queue.put(token)

    def on_llm_end(self, response, **kwargs):
        self.done = True
        self.queue.put(None)
        
    def on_llm_error(self, error: Exception, **kwargs):
        """Gestion des erreurs du LLM"""
        self.queue.put({"error": True, "message": str(error), "type": "llm_error"})
        self.queue.put(None)  # Sentinel pour indiquer la fin

# Import des LLM pour différents providers
from langchain_openai import ChatOpenAI  # Pour OpenAI
from langchain_community.chat_models import ChatAnthropic  # Pour Anthropic, etc.
import getpass
from .llama import LlamaLLM  # Notre LlamaLLM personnalisé
from langchain.callbacks.manager import CallbackManager  # Utilisation de CallbackManager avec le paramètre 'handlers'

class ChatHandlerError(Exception):
    """Classe d'erreur personnalisée pour le ChatHandler"""
    def __init__(self, message: str, error_type: str = "generation", status_code: int = 500, details: Optional[str] = None):
        self.message = message
        self.error_type = error_type
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)
        
    def to_dict(self) -> Dict[str, Any]:
        """Convertit l'erreur en dictionnaire pour le frontend"""
        error_dict = {
            "error": True,
            "message": self.message,
            "type": self.error_type,
            "status": self.status_code
        }
        if self.details:
            error_dict["details"] = self.details
        return error_dict
        
    def to_json(self) -> str:
        """Convertit l'erreur en JSON pour le streaming"""
        return json.dumps(self.to_dict())

if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter your OpenAI API key: ")

class ChatHandler:
    """
    Classe responsable de gérer la génération de réponse en streaming pour le chat.
    """
    def __init__(self):
        # On pourrait charger ici une configuration globale (mappings modelId -> provider, etc.)
        self.max_retries = 3
        self.retry_delay = 2  # Délai initial en secondes pour le backoff exponentiel
        
    def get_llm(self, model_id: str, temperature: float, max_tokens: int):
        """Retourne l'instance du LLM appropriée selon le modèle demandé"""
        try:
            # Pour le modèle Llama, on retourne notre LlamaLLM personnalisé
            if model_id.lower() in ["llama", "llama-3.1-70b", "llama-3.1-70b-versatile"]:
                return LlamaLLM(temperature=temperature, max_tokens=max_tokens)
                
            # Pour les modèles Claude d'Anthropic
            if model_id.lower().startswith("claude"):
                return ChatAnthropic(
                    model=model_id,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    streaming=True,
                )
                
            # Sinon, on utilise ChatOpenAI par défaut
            return ChatOpenAI(
                model=model_id,
                temperature=temperature,
                max_tokens=max_tokens,
                streaming=True,
            )
        except Exception as e:
            # Gérer les erreurs d'initialisation du LLM
            raise ChatHandlerError(
                message=f"Erreur lors de l'initialisation du modèle {model_id}: {str(e)}",
                error_type="model_init_error",
                status_code=500,
                details=traceback.format_exc()
            )

    def generate_response(self, payload: Dict[str, Any]) -> Generator[str, None, None]:
        """Génère une réponse token par token à partir d'un modèle LLM"""
        # Vérification des paramètres requis
        # print(payload,"dddddddddddddddddddddd")
        # if not payload.get("messages"):
        #     raise ChatHandlerError(
        #         message="Historique de messages non fourni",
        #         error_type="validation",
        #         status_code=400
        #     )
            
        # Extraction des paramètres du payload
        content = payload.get("content", "")
        if not content.strip():
            raise ChatHandlerError(
                message="Le contenu du message ne peut pas être vide",
                error_type="validation",
                status_code=400
            )
            
        messages = payload.get("messages", [])
        model_id = payload.get("modelId", "gpt-3.5-turbo")
        temperature = payload.get("temperature", 0.7)
        max_tokens = payload.get("maxTokens", 2000)
        retries = 0
        
        while retries <= self.max_retries:
            # Stockage de l'exception pour la propager à la fin si nécessaire
            self.exception = None
            callback_handler = StreamingCallbackHandler()
            
            try:
                # Préparation de la mémoire de la conversation
                memory = ConversationBufferMemory(return_messages=True)
                for msg in messages:
                    role = msg.get("author")
                    text = msg.get("content", "")
                    if role == "user":
                        memory.chat_memory.add_user_message(text)
                    elif role == "assistant":
                        memory.chat_memory.add_ai_message(text)
                    elif role == "system":
                        memory.chat_memory.add_message(SystemMessage(content=text))

                # Gestion du template
                prompt_template_str = payload.get("promptTemplate")
                if not prompt_template_str:
                    prompt_template_str = (
                        "You are a helpful assistant called OuebxChat. "
                        "Context: {history}\n"
                        "User: {input}\n"
                        "Assistant:"
                    )
                prompt = PromptTemplate(
                    input_variables=["history", "input"],
                    template=prompt_template_str,
                )

                # Préparation du prompt en injectant l'historique et le message courant
                history_text = memory.buffer
                formatted_prompt = prompt.format(history=history_text, input=content)

                # Instanciation de l'LLM
                llm = self.get_llm(model_id, temperature, max_tokens)

                # Création du CallbackManager
                callback_manager = CallbackManager(handlers=[callback_handler])

                def run_llm():
                    try:
                        if model_id.lower() in ["llama", "llama-3.1-70b", "llama-3.1-70b-versatile"]:
                            llm.invoke(formatted_prompt, callback_manager=callback_handler)
                        else:
                            llm.invoke([HumanMessage(content=formatted_prompt)], callback_manager=callback_handler)
                    except Exception as e:
                        logging.error(f"Erreur lors de la génération LLM : {str(e)}\n{traceback.format_exc()}")
                        self.exception = e
                        # Envoyer l'erreur dans la file pour la gestion du streaming
                        error_message = {
                            "error": True,
                            "message": str(e),
                            "type": "generation",
                            "status": 500,
                            "details": traceback.format_exc()
                        }
                        callback_handler.queue.put(json.dumps(error_message))
                    finally:
                        # On s'assure de placer le sentinel pour terminer la boucle de streaming
                        callback_handler.queue.put(None)

                # Lancer l'appel au LLM dans un thread séparé
                thread = threading.Thread(target=run_llm)
                thread.start()

                # Génération en streaming en lisant la file d'attente des tokens
                while True:
                    token = callback_handler.queue.get()
                    if token is None:
                        break
                        
                    # Vérification si c'est un message d'erreur
                    if isinstance(token, dict) and token.get("error"):
                        # C'est une erreur du callback, la convertir en JSON pour le frontend
                        yield json.dumps(token)
                        break
                    elif isinstance(token, str) and token.startswith('{"error":'):
                        # C'est déjà un JSON d'erreur, le transmettre tel quel
                        print("TOKEN YIELD :::::::::", token)
                        yield token
                        break
                    else:
                        # C'est un token normal, le transmettre
                        yield token

                thread.join()

                # Si aucune exception et streaming terminé, sortir de la boucle
                if self.exception is None:
                    break
                    
                # Gestion des erreurs connues qui nécessitent une nouvelle tentative
                if isinstance(self.exception, Exception):
                    error_message = str(self.exception).lower()
                    
                    # Erreurs de rate limit (à adapter selon les messages exacts des providers)
                    if any(term in error_message for term in ["rate limit", "too many requests", "429"]):
                        if retries < self.max_retries:
                            retries += 1
                            wait_time = self.retry_delay * (2 ** retries)  # Backoff exponentiel
                            logging.warning(f"Rate limit atteint, nouvelle tentative dans {wait_time}s... ({retries}/{self.max_retries})")
                            time.sleep(wait_time)
                            continue
                        else:
                            # Convertir en ChatHandlerError pour le frontend
                            error = ChatHandlerError(
                                message="Limite de requêtes atteinte. Veuillez réessayer plus tard.",
                                error_type="rate_limit",
                                status_code=429
                            )
                            yield error.to_json()
                            return
                            
                    # Erreurs d'authentification
                    elif any(term in error_message for term in ["authentication", "unauthorized", "api key", "401"]):
                        error = ChatHandlerError(
                            message="Erreur d'authentification avec le service LLM. Veuillez vérifier vos identifiants.",
                            error_type="auth",
                            status_code=401
                        )
                        yield error.to_json()
                        return
                        
                    # Erreurs de timeout
                    elif any(term in error_message for term in ["timeout", "timed out"]):
                        if retries < self.max_retries:
                            retries += 1
                            wait_time = self.retry_delay * (2 ** retries)
                            logging.warning(f"Timeout, nouvelle tentative dans {wait_time}s... ({retries}/{self.max_retries})")
                            time.sleep(wait_time)
                            continue
                        else:
                            error = ChatHandlerError(
                                message="Le service LLM met trop de temps à répondre. Veuillez réessayer.",
                                error_type="timeout",
                                status_code=504
                            )
                            yield error.to_json()
                            return
                
                # Autres exceptions non gérées spécifiquement
                error = ChatHandlerError(
                    message=f"Erreur lors de la génération: {str(self.exception)}",
                    error_type="generation",
                    status_code=500,
                    details=traceback.format_exc()
                )
                yield error.to_json()
                return
                
            except Exception as e:
                # Erreurs hors du thread de génération
                logging.error(f"Erreur externe au thread LLM: {str(e)}\n{traceback.format_exc()}")
                
                error_type = "unknown"
                status_code = 500
                message = str(e)
                
                # Analyse du message d'erreur pour déterminer le type
                error_message = message.lower()
                if any(term in error_message for term in ["network", "connection"]):
                    error_type = "network"
                    status_code = 503
                    message = "Impossible de se connecter au service LLM. Vérifiez votre connexion."
                elif any(term in error_message for term in ["model", "not found", "404"]):
                    error_type = "not_found"
                    status_code = 404
                    message = f"Le modèle '{model_id}' n'a pas été trouvé ou n'est pas disponible."
                
                error = ChatHandlerError(
                    message=message,
                    error_type=error_type,
                    status_code=status_code,
                    details=traceback.format_exc()
                )
                yield error.to_json()
                return