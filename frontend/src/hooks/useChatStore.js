// Simulateur de Zustand pour la persistance (en mémoire)
import { useState } from "react";
import { postResource } from "../services/api"; // Ajustez le chemin selon votre structure

export const useChatStore = () => {
  const [messages, setMessages] = useState([
    { text: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?", sender: 'assistant', timestamp: new Date() }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: Date.now(), timestamp: new Date() }]);
  };

  const clearMessages = () => {
    setMessages([{ id: 1, text: "Conversation restaurée ! Comment puis-je vous aider ?", sender: 'assistant', timestamp: new Date() }]);
  };

  // Fonction pour envoyer un message à l'API et obtenir une réponse
  const sendMessageToAPI = async (userMessage) => {
    setIsLoading(true);
    
    try {
      // Ajouter le message utilisateur d'abord
      const userMsg = { 
        text: userMessage, 
        sender: 'user', 
        id: Date.now(), 
        timestamp: new Date() 
      };
      addMessage(userMsg);

      // Préparer l'historique des messages pour l'API
      const apiMessages = messages
        .map(msg => ({
          author: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      // Ajouter le nouveau message utilisateur
      apiMessages.push({
        author: 'user',
        content: userMessage
      });

      // Préparer les données pour l'API
      const apiData = {
        content: userMessage,
        author: "user",
        temperature: 1,
        maxTokens: 2000,
        messages: apiMessages,
        modelId: "llama"
      };

      // Envoyer la requête à l'API
      const response = await postResource('/chat/message/generate/', apiData); // Ajustez l'endpoint selon votre API
      
      // Ajouter la réponse de l'assistant
      if (response.data) {
        console.log(response)
        addMessage({
          text: response.data,
          sender: 'assistant',
          id: Date.now() + 1,
          timestamp: new Date()
        });
      } else {
        // Message d'erreur si la réponse n'est pas dans le format attendu
        addMessage({
          text: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
          sender: 'assistant',
          id: Date.now() + 1,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Message d'erreur pour l'utilisateur
      addMessage({
        text: "Désolé, une erreur s'est produite. Veuillez vérifier votre connexion et réessayer.",
        sender: 'assistant',
        id: Date.now() + 1,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    addMessage,
    clearMessages,
    sendMessageToAPI,
    isLoading,
    isOpen,
    setIsOpen,
    position,
    setPosition,
    size,
    setSize
  };
};