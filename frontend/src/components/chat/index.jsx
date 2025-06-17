import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Mic, MicOff, Send, Volume2, RotateCcw, Settings, Minimize2, Maximize2, Move, CornerDownLeft, Loader2 } from 'lucide-react';
import useSpeechToText from 'react-hook-speech-to-text';
import { useChatStore } from "../../hooks/useChatStore"

const ChatBot = () => {
  const {
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
  } = useChatStore();

  // Hook pour la reconnaissance vocale
  const {
    error,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
    speechRecognitionProperties: {
      lang: 'fr-FR',
      interimResults: true,
      continuous: true
    }
  });

  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  // Gestion de la transcription - mise à jour en temps réel dans le champ de texte
  useEffect(() => {
    if (results.length > 0) {
      const newTranscription = results.map(item => item.transcript).join(' ');
      setInputText(newTranscription);
    }
  }, [results]);

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate the new height
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 44; // hauteur minimale
      const maxHeight = 120; // hauteur maximale (environ 4-5 lignes)
      
      // Set the height, constrained by min and max
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  // Gestion des erreurs de reconnaissance vocale
  if (error) {
    console.error('Erreur de reconnaissance vocale:', error);
  }

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

  // Traitement des messages - maintenant utilise l'API
  const processMessage = async (text) => {
    // Vérifier d'abord les actions de navigation
    const lowerText = text.toLowerCase();
    for (const [keyword, action] of Object.entries(navigationActions)) {
      if (lowerText.includes(keyword)) {
        addMessage({ text, sender: 'user' });
        setTimeout(() => {
          addMessage({ 
            text: `Je vous redirige vers la section ${keyword} !`, 
            sender: 'assistant' 
          });
          action();
        }, 1000);
        return;
      }
    }

    // Sinon, envoyer à l'API
    await sendMessageToAPI(text);
  };

  const handleSendMessage = async () => {
    if (inputText.trim() && !isLoading) {
      const messageText = inputText.trim();
      setInputText('');
      await processMessage(messageText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      setInputText(''); // Vider le champ avant de commencer
      startSpeechToText();
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
            <p className="text-xs text-white/80">
              {isLoading ? 'En cours de traitement...' : 'En ligne'}
            </p>
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
                  {message.sender === 'assistant' && (
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
                      {message.sender === 'assistant' && (
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
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="mb-4 flex justify-start">
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Loader2 size={14} className="text-white animate-spin" />
                  </div>
                  <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">L'assistant réfléchit...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isRecording ? "Parlez maintenant..." : "Tapez votre message..."}
                  disabled={isLoading}
                  className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    minHeight: '44px',
                    maxHeight: '120px',
                    height: '44px'
                  }}
                />
                <button
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`absolute right-3 top-3 ${
                    isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-blue-500'
                  } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all duration-200 transform hover:scale-105 flex-shrink-0"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            
            {/* Affichage des ondes sonores en bas quand l'enregistrement est actif */}
            {isRecording && (
              <div className="">
                <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Enregistrement en cours... Cliquez sur le micro pour arrêter
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-2 text-red-500 text-sm">
                Erreur de reconnaissance vocale. Veuillez réessayer.
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