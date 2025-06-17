import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Mic, MicOff, Send, Volume2, RotateCcw, Settings, Minimize2, Maximize2, Move, CornerDownLeft } from 'lucide-react';
import { useChatStore } from "../../hooks/useChatStore"

const ChatBot = () => {
  const {
    messages,
    addMessage,
    clearMessages,
    isOpen,
    setIsOpen,
    position,
    setPosition,
    size,
    setSize
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Actions de navigation possibles
  const navigationActions = {
    'accueil': () => window.location.hash = '#accueil',
    'contact': () => window.location.hash = '#contact',
    'produits': () => window.location.hash = '#produits',
    'services': () => window.location.hash = '#services',
    'à propos': () => window.location.hash = '#about'
  };

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Configuration de la reconnaissance vocale
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Gestion du drag & drop
  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle') || e.target.closest('.chat-content')) return;
    setIsDragging(true);
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset]);

  // Gestion du redimensionnement
  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleResizeMouseMove = (e) => {
      const newWidth = Math.max(300, startWidth + (e.clientX - startX));
      const newHeight = Math.max(400, startHeight + (e.clientY - startY));
      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeMouseUp = () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  // Traitement des messages
  const processMessage = (text) => {
    // Ajouter le message utilisateur
    addMessage({ text, sender: 'user' });

    // Vérifier les actions de navigation
    const lowerText = text.toLowerCase();
    for (const [keyword, action] of Object.entries(navigationActions)) {
      if (lowerText.includes(keyword)) {
        setTimeout(() => {
          addMessage({ 
            text: `Je vous redirige vers la section ${keyword} !`, 
            sender: 'bot' 
          });
          action();
        }, 1000);
        return;
      }
    }

    // Réponses automatiques simulées
    setTimeout(() => {
      const responses = [
        "C'est une excellente question ! Comment puis-je vous aider davantage ?",
        "Je comprends votre demande. Voulez-vous que je vous guide vers une section spécifique ?",
        "Merci pour votre message. Y a-t-il autre chose que je puisse faire pour vous ?",
        "Intéressant ! Avez-vous besoin d'informations supplémentaires ?",
        "Je suis là pour vous aider. N'hésitez pas à me poser d'autres questions !"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage({ text: randomResponse, sender: 'bot' });
    }, 1500);
  };

  const handleSendMessage = () => {
    if (inputText.trim()) {
      processMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen) {
    return (
      <div 
        className="fixed z-50 cursor-move"
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 border-2 border-white/20"
        >
          <MessageCircle size={24} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={chatRef}
      className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/50 backdrop-blur-sm"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`
      }}
    >
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl cursor-move flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle size={16} />
          </div>
          <div>
            <h3 className="font-semibold">Assistant Chat</h3>
            <p className="text-xs text-white/80">En ligne</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Move size={16} className="opacity-60" />
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={clearMessages}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="chat-content p-4 overflow-y-auto bg-gray-50/50" style={{ height: `${size.height - 140}px` }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={14} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`p-3 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.sender === 'bot' && (
                        <button
                          onClick={() => speakMessage(message.text)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '100px' }}
                />
                <button
                  onClick={toggleListening}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isListening ? 'text-tertiary' : 'text-gray-400 hover:text-blue-500'
                  } transition-colors`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <Send size={18} />
              </button>
            </div>
            
            {isListening && (
              <div className="mt-2 flex items-center gap-2 text-tertiary text-sm">
                <div className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></div>
                Écoute en cours...
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeMouseDown}
          >
            <CornerDownLeft size={16} className="rotate-180 text-gray-400" />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBot;