// Simulateur de Zustand pour la persistance (en mémoire)
import { useState } from "react";

export const useChatStore = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?", sender: 'bot', timestamp: new Date() }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 400, height: 500 });

  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: Date.now(), timestamp: new Date() }]);
  };

  const clearMessages = () => {
    setMessages([{ id: 1, text: "Conversation restaurée ! Comment puis-je vous aider ?", sender: 'bot', timestamp: new Date() }]);
  };

  return {
    messages,
    addMessage,
    clearMessages,
    isOpen,
    setIsOpen,
    position,
    setPosition,
    size,
    setSize
  };
};