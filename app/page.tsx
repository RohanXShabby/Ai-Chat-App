'use client'
import { useState } from "react";

interface Message {
  role: string;
  content: string;
}

interface ChatResponse {
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<string>("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [stream, setStream] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [streamResponse, setStreamResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChat = async (): Promise<void> => {
    setLoading(true);
    setResponse(null);
    setError("");

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: "user", content: messages }] }),
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const data: ChatResponse = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch response from the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleStreamChat = async (): Promise<void> => {
    setStream(true);
    setStreamResponse("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: messages }] }),
      });

      if (!res.ok || !res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setStreamResponse((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Stream error:", error);
      setError("Failed to stream response");
    } finally {
      setStream(false);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-3xl bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700">

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-center text-blue-400 mb-8">
          ⚡ AI Chat App
        </h1>

        {/* Input */}
        <textarea
          className="w-full h-32 p-4 rounded-xl bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-100"
          placeholder="Type your message here..."
          value={messages}
          onChange={(e) => setMessages(e.target.value)}
        />

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleChat}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-white font-semibold shadow-md transition"
          >
            {loading ? 'Loading...' : 'Send'}
          </button>
          <button
            onClick={handleStreamChat}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-xl text-white font-semibold shadow-md transition"
          >
            {loading ? 'Loading...' : 'Send Message'}
          </button>
        </div>

        {/* Normal Response */}
        {response?.content && (
          <div className="mt-6 p-4 bg-gray-700/70 rounded-xl border border-gray-600 shadow-inner">
            <h3 className="font-bold text-blue-300 mb-2">Response:</h3>
            <p className="text-gray-200">{response.content}</p>
          </div>
        )}

        {/* Stream Response */}
        {streamResponse && (
          <div className="mt-6 p-4 bg-gray-700/70 rounded-xl border border-gray-600 shadow-inner">
            <h3 className="font-bold text-green-300 mb-2">Stream Response:</h3>
            <p className="text-gray-200 whitespace-pre-line">{streamResponse}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/70 border border-red-600 text-red-200 rounded-xl shadow-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
