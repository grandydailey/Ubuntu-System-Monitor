import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import Panel from './Panel';
import type { Message } from '../types';
import { CopyIcon, CheckIcon, ClearIcon } from './icons';

interface ChatbotPanelProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  initialQuery?: string;
  onQueryHandled?: () => void;
  autoSendQuery?: string;
  onQuerySent?: () => void;
}

const CodeCopyButton = ({ code }: { code: string }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }, [code]);

    return (
        <button
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-panel-header/80 backdrop-blur-sm hover:bg-border text-text-secondary px-2 py-1 rounded-md text-xs flex items-center space-x-1.5 transition-all opacity-0 group-hover:opacity-100"
        >
            {isCopied ? <CheckIcon className="text-green" /> : <CopyIcon />}
            <span>{isCopied ? "Copied!" : "Copy"}</span>
        </button>
    );
};

const TextRenderer = ({ text }: { text: string }) => {
    const elements = text.split('\n').map((line, i) => {
        if (line.trim().startsWith('- ')) {
            const content = line.trim().substring(2)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: content }} />;
        }
        const formattedLine = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });

    return <>{elements}</>;
};

const CHAT_MODEL = 'gemini-2.5-flash';
const CHAT_CONFIG = {
  systemInstruction: 'You are an expert Ubuntu system administrator and performance tuning specialist. You will be asked questions about system errors, log files, and performance optimization. Provide concise, accurate, and helpful advice using markdown formatting. When providing commands, wrap them in ```bash ... ```.',
};

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ messages, setMessages, initialQuery, onQueryHandled, autoSendQuery, onQuerySent }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      chatRef.current = ai.chats.create({
        model: CHAT_MODEL,
        config: CHAT_CONFIG,
      });
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      setMessages([{ role: 'model', content: "Error: Could not initialize AI Assistant. API key may be missing or invalid." }]);
    }
  }, [setMessages]);
  
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
      const errorMessage: Message = { role: 'model', content: "Sorry, I encountered an error communicating with the API. Please check your connection and API key." };
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === 'model' && lastMessage?.content === '') {
          newMessages[newMessages.length - 1] = errorMessage;
        } else {
          newMessages.push(errorMessage)
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [setMessages]);

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

  const handleClear = () => {
    setMessages([]);
    // Optionally re-initialize chat for fresh history
    if (chatRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        // FIX: The 'config' property is private. Re-create the chat session using the original configuration.
        chatRef.current = ai.chats.create({ model: CHAT_MODEL, config: CHAT_CONFIG });
    }
  };
  
  const renderMessageContent = (msg: Message) => {
    const { content } = msg;
    const codeBlockRegex = /```(bash|sh|zsh|shell|)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<TextRenderer key={`text-${lastIndex}`} text={content.substring(lastIndex, match.index)} />);
        }
        const code = match[2];
        parts.push(
            <div key={`code-${match.index}`} className="relative group my-2">
                <pre className="bg-background/80 p-3 rounded-md text-sm text-green overflow-x-auto font-mono pr-20">
                    <code>{code}</code>
                </pre>
                <CodeCopyButton code={code} />
            </div>
        );
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        parts.push(<TextRenderer key={`text-${lastIndex}`} text={content.substring(lastIndex)} />);
    }
    
    if (isLoading && messages[messages.length - 1] === msg) {
        parts.push(<span key="cursor" className="inline-block w-2 h-4 ml-1 align-middle bg-primary animate-pulse"></span>);
    }

    return parts;
  };

  return (
    <Panel 
        title="./ai_assistant --ask" 
        className="flex flex-col"
        titleClassName="flex justify-between items-center"
    >
      <div className="flex justify-between items-center text-primary font-mono font-medium p-2 border-b border-border flex-shrink-0">
        <h2 className=""><span className="text-text-muted">$ </span>./ai_assistant --ask</h2>
        {messages.length > 0 && (
             <button onClick={handleClear} className="text-text-secondary hover:text-red flex items-center space-x-1 text-xs font-sans p-1 rounded-md hover:bg-border transition-colors">
                <ClearIcon />
                <span>Clear</span>
            </button>
        )}
      </div>

      <div ref={chatHistoryRef} className="flex-grow p-4 overflow-y-auto space-y-4 text-sm">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-sm whitespace-pre-wrap font-sans ${msg.role === 'user' ? 'bg-primary/90 text-text-inverted' : 'bg-panel-header text-text-main'}`}>
              {renderMessageContent(msg)}
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
            className="flex-grow bg-background border border-border rounded-md px-3 py-1.5 text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-panel-header font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !input}
            className="bg-primary hover:bg-primary-focus text-text-inverted font-bold py-1.5 px-3 rounded-md transition-colors duration-200 text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </Panel>
  );
};

export default ChatbotPanel;