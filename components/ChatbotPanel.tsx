import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import Panel from './Panel';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatbotPanelProps {
  initialQuery?: string;
  onQueryHandled?: () => void;
  autoSendQuery?: string;
  onQuerySent?: () => void;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ initialQuery, onQueryHandled, autoSendQuery, onQuerySent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are an expert Ubuntu system administrator and performance tuning specialist. You will be asked questions about system errors, log files, and performance optimization. Provide concise, accurate, and helpful advice. When providing commands, wrap them in ```bash ... ```.',
        },
      });
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      setMessages([{ role: 'model', content: "Error: Could not initialize AI Assistant. API key may be missing or invalid." }]);
    }
  }, []);
  
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !chatRef.current) return;

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await chatRef.current.sendMessageStream({ message: messageText });
      
      let modelResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of result) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage: Message = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'model' && newMessages[newMessages.length - 1]?.content === '') {
          newMessages[newMessages.length - 1] = errorMessage;
        } else {
          newMessages.push(errorMessage)
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery && onQueryHandled) {
      setInput(initialQuery);
      inputRef.current?.focus();
      onQueryHandled();
    }
  }, [initialQuery, onQueryHandled]);

  useEffect(() => {
    if (autoSendQuery && onQuerySent) {
      sendMessage(autoSendQuery);
      onQuerySent();
    }
  }, [autoSendQuery, onQuerySent, sendMessage]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  };

  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(bash|sh|zsh|shell|)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
      }
      const code = match[2];
      parts.push(
        <pre key={`code-${match.index}`} className="bg-black/50 p-2 my-2 rounded-md text-sm text-green overflow-x-auto font-mono">
          <code>{code}</code>
        </pre>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
    }
    
    // Add a blinking cursor to the last model message while loading
    if (isLoading && messages[messages.length - 1]?.role === 'model' && messages[messages.length-1]?.content === content) {
        parts.push(<span key="cursor" className="inline-block w-2 h-4 ml-1 align-middle bg-green animate-pulse"></span>);
    }

    return parts;
  };

  return (
    <Panel title="./ai_assistant --ask" className="flex flex-col">
      <div ref={chatHistoryRef} className="flex-grow p-2 overflow-y-auto space-y-4 text-sm">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary/80 text-black' : 'bg-panel-header text-text-main'}`}>
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}
         {messages.length === 0 && !isLoading && (
            <div className="text-center text-text-muted pt-8">
                <p>Ask about system errors or performance tuning.</p>
                <p className="mt-2 text-xs">e.g., "How do I check for memory leaks?"</p>
            </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-2 border-t border-border">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Generating response..." : "Ask the AI assistant..."}
            disabled={isLoading}
            className="flex-grow bg-background border border-border rounded-md px-3 py-1 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-panel-header"
          />
          <button
            type="submit"
            disabled={isLoading || !input}
            className="bg-primary hover:bg-primary-focus text-black font-bold py-1 px-3 rounded-md transition-colors duration-200 text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </Panel>
  );
};

export default ChatbotPanel;