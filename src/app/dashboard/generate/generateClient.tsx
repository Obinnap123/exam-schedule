"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function GenerateTimetablePage() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function createChat() {
      setIsLoadingChat(true);
      try {
        const res = await fetch("/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user-123",
            title: "Generate Timetable",
          }),
        });
        const data = await res.json();
        if (data?.id) {
          setChatId(String(data.id));
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to create chat", err);
      } finally {
        setIsLoadingChat(false);
      }
    }
    createChat();
  }, []);

  async function handleSend() {
    if (!input.trim() || !chatId) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: Number(chatId), content: input.trim() }),
      });
      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.content || "No response from AI.",
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error sending message." },
      ]);
    } finally {
      setInput("");
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) handleSend();
    }
  }

  function handleNewChat() {
    setChatId(null);
    setMessages([]);
    setInput("");
    window.location.reload();
  }

  return (
    <div className="flex h-screen w-full bg-[#343541] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#202123] flex flex-col p-4 border-r border-[#2a2b32]">
        <h2 className="text-xl font-bold mb-4 text-white">Exam Scheduler</h2>
        <button
          onClick={handleNewChat}
          className="rounded bg-[#343541] px-3 py-2 text-center text-sm font-semibold hover:bg-[#444654] transition mb-2 border border-[#444654] text-white"
        >
          + New Chat
        </button>
        <div className="flex-1" />
        <footer className="text-xs text-gray-400">&copy; 2025 Your Company</footer>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 h-full relative">
        {/* Topbar */}
        <div className="h-16 bg-[#343541] border-b border-[#2a2b32] px-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Generate Timetable</h3>
          <div className="flex items-center space-x-4">
            <span className="text-gray-200">Hello, Admin</span>
            <div className="w-9 h-9 rounded-full bg-gray-400"></div>
          </div>
        </div>

        {/* Messages */}
        <section
          className={`flex-1 overflow-y-auto bg-[#343541] transition-all duration-500 ${
            messages.length === 0 ? "flex items-center justify-center" : ""
          }`}
        >
          <div className="w-full max-w-2xl mx-auto space-y-6 px-4 py-8">
            {messages.length === 0 && !isLoadingChat && (
              <p className="text-center text-2xl text-gray-400">
                What can I help with?
              </p>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#444654] flex items-center justify-center text-lg font-bold">
                    <span>🤖</span>
                  </div>
                )}
                <div
                  className={`prose max-w-[75%] px-5 py-3 text-base whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-[#2b90d9] text-white rounded-2xl rounded-br-none"
                      : "bg-[#444654] text-gray-100 rounded-2xl rounded-bl-none"
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2b90d9] flex items-center justify-center text-lg font-bold">
                    <span>🧑</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Input Area */}
        <form
          className={`w-full bg-[#343541] border-t border-[#2a2b32] py-6 px-0 ${
            messages.length === 0
              ? "absolute top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              : "sticky bottom-0"
          }`}
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSending) handleSend();
          }}
        >
          <div className="max-w-2xl mx-auto w-full px-4 flex items-end gap-3 relative">
            {/* Plus icon */}
            <button
              type="button"
              className="text-gray-400 hover:text-gray-300 transition"
              title="Upload file (not implemented)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                rows={1}
                placeholder="Send a message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending || isLoadingChat}
                className="w-full resize-none rounded-lg border border-[#444654] bg-[#40414f] p-4 pl-4 pr-14 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#19c37d] transition"
                style={{
                  minHeight: "48px",
                  maxHeight: "160px",
                  overflowY: "auto",
                }}
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={isSending || isLoadingChat || !input.trim()}
                className="absolute bottom-2 right-2 p-2 rounded-lg bg-[#19c37d] hover:bg-[#15a06a] text-white transition disabled:opacity-50"
                title={isSending ? "Stop generation (not wired yet)" : "Send message"}
              >
                {isSending ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4.5 10.5l11-4.5-4.5 11-1.5-4.5-4.5-1.5z" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>

            {/* Voice icon */}
            <button
              type="button"
              title="Voice input (not implemented)"
              className="text-gray-400 hover:text-gray-300 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" height="20" viewBox="0 0 24 24">
                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-5 8v2h-2v-2h2z" />
              </svg>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
