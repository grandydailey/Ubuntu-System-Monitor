import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Panel from './Panel';
import { SendIcon } from './icons';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hello! How can I help you with your Ubuntu system today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage: Message = { role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      // FIX: Per @google/genai guidelines, for simple text prompts, passing the string directly to `contents` is the recommended approach.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: trimmedInput,
      });
      
      const botResponse: Message = { role: 'model', content: response.text };
      setMessages(prev => [...prev, botResponse]);

    } catch (err) {
      const errorMessage = 'Sorry, something went wrong. Please try again.';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Panel title="gemini-cli" className="flex flex-col">
      <div className="p-2 flex-grow overflow-y-auto text-xs space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-sm lg:max-w-md rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-cyan-800/80 text-cyan-100'
                  : 'bg-gray-700/80 text-gray-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700/80 text-gray-400 rounded-lg px-3 py-2 animate-pulse">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your system..."
            disabled={isLoading}
            className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </Panel>
  );
};

export default ChatPanel;
