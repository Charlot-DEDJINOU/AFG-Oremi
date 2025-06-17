import os
from typing import Any, List, Optional, Union
from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun
from groq import Groq
from langchain.schema import BaseMessage

class LlamaLLM(LLM):
    temperature: float = 0.95
    max_tokens: int = 1024
    top_p: float = 0.95
    api_key: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True

    def __init__(
        self,
        temperature: float = 0.95,
        max_tokens: int = 1024,
        top_p: float = 0.95,
        **kwargs: Any
    ):
        # Injection des paramètres dans kwargs pour les assigner via Pydantic
        kwargs["temperature"] = temperature
        kwargs["max_tokens"] = max_tokens
        kwargs["top_p"] = top_p
        if "api_key" not in kwargs:
            kwargs["api_key"] = os.getenv("GROQ_API_KEY")
        super().__init__(**kwargs)

    @property
    def _llm_type(self):
        return "llama-3.3-70b-versatile"

    def _call(
        self,
        prompt: Union[str, List[BaseMessage]],
        stop: Optional[List[str]] = None,
        callback_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ):
        # run_manager: Optional[CallbackManagerForLLMRun] = kwargs.pop("run_manager", None)
        if stop is not None:
            raise ValueError("Les arguments 'stop' ne sont pas supportés dans cette implémentation.")

        # Si prompt est une liste de messages, on joint leur contenu en une chaîne
        if isinstance(prompt, list):
            prompt = "\n".join([m.content for m in prompt if hasattr(m, "content")])
        
        client = Groq(api_key=self.api_key)
        messages = [{"role": "user", "content": prompt}]
        full_response = ""
        try:
            # Appel à l'API Groq en mode streaming
            stream_resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                top_p=self.top_p,
                stream=True  # En mode streaming
            )
            for chunk in stream_resp:
                token = ""
                try:
                    token = chunk.choices[0].delta.content
                    # print("hereeeeeeeeeeee  is the chunk :::::::::::::::::::", chunk)
                    # print("here is the token :::::::::::::::", token)
                except AttributeError:
                    token = chunk.choices[0].message.content

                # Assurez-vous que token est une chaîne (si None, on remplace par "")
                if token is None:
                    token = ""
                
                full_response += token
                if callback_manager:
                    callback_manager.on_llm_new_token(token)
            return full_response.strip()
        except Exception as e:
            print(f"Erreur lors de l'appel à l'API Groq : {str(e)}")
            raise

    @property
    def _identifying_params(self):
        return {
            "model": "llama-3.3-70b-versatile",
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_p": self.top_p
        }
