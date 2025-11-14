'use client'
import { useState } from "react";
import { Send } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleStreamChat = async (): Promise<void> => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    // Add placeholder for assistant message
    const assistantIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: userMessage.content }] }),
      });

      if (!res.ok || !res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantIndex] = { role: 'assistant', content: accumulatedText };
          return newMessages;
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Stream error:", message);
      setError("Failed to stream response");
      // Remove the placeholder message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStreamChat();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-2xl h-[600px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200/50">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200/50 bg-white/50">
          <h1 className="text-2xl font-bold text-gray-800">
            acme <span className="text-sm font-normal text-gray-500">AI</span>
          </h1>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-center">Start a conversation with AI</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-purple-100 text-purple-900'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 text-red-600 rounded-2xl px-4 py-3 text-sm">
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/50 border-t border-gray-200/50">
          <div className="flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-2 border border-gray-200/50">
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
              placeholder="How"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Attach"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Attach file"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <button
              onClick={handleStreamChat}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              Ask AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}