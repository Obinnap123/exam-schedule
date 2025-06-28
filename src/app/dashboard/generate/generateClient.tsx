"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { 
  ArrowUp, 
  Mic, 
  Plus, 
  Square, 
  MessageSquare,
  Edit3,
  Trash2,
  Share,
  MoreHorizontal,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Paperclip,
  Image,
  Headphones,
  Menu,
  X,
  Search,
  Sparkles,
  Clock,
  Smile,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/Components/Ui/Textarea";
import { Button } from "@/Components/Ui/Button";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  id: string;
  fileUrl?: string;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

const STORAGE_KEYS = {
  MESSAGES: 'chatgpt_messages',
  CHAT_ID: 'chatgpt_chat_id',
  CHAT_HISTORY: 'chatgpt_chat_history',
  SIDEBAR_COLLAPSED: 'chatgpt_sidebar_collapsed'
};

function saveToStorage(key: string, value: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window !== "undefined") {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
  }
  return fallback;
}

export default function GenerateClient() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentChatTitle, setCurrentChatTitle] = useState("New chat");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted state on mount
  useEffect(() => {
    setMessages(getFromStorage<Message[]>(STORAGE_KEYS.MESSAGES, []));
    setChatId(getFromStorage<string | null>(STORAGE_KEYS.CHAT_ID, null));
    setChatHistory(getFromStorage<ChatHistory[]>(STORAGE_KEYS.CHAT_HISTORY, []));
    setSidebarCollapsed(getFromStorage<boolean>(STORAGE_KEYS.SIDEBAR_COLLAPSED, false));
  }, []);

  // Persist state on change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MESSAGES, messages);
  }, [messages]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CHAT_ID, chatId);
  }, [chatId]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CHAT_HISTORY, chatHistory);
  }, [chatHistory]);
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIDEBAR_COLLAPSED, sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Start new chat if no chatId
  useEffect(() => {
    if (!chatId) {
      const startNewChat = async () => {
        try {
          const res = await fetch("/api/chat/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "user-123",
              title: "New chat",
            }),
          });
          if (!res.ok) return;
          const data = await res.json();
          setChatId(data.id);
        } catch {}
      };
      startNewChat();
    }
  }, [chatId]);

  const handleSubmit = async () => {
    if (!input.trim() || chatId === null) return;

    const userMessage: Message = { 
      role: "user", 
      content: input.trim(),
      timestamp: new Date(),
      id: Date.now().toString()
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      setIsSending(true);
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          content: userMessage.content,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();

      const assistantMessage: Message = {
        role: data.role === "assistant" ? "assistant" : "user",
        content: data.content,
        timestamp: new Date(),
        id: (Date.now() + 1).toString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
    } finally {
      setIsSending(false);
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For demo, just show file name as a message
    const fileUrl = URL.createObjectURL(file);
    const userMessage: Message = {
      role: "user",
      content: file.name,
      timestamp: new Date(),
      id: Date.now().toString(),
      fileUrl
    };
    setMessages((prev) => [...prev, userMessage]);
  };

  // Voice input handler (stub)
  const handleVoiceInput = () => {
    alert("Voice input not implemented in this demo.");
  };

  // Emoji picker handler (stub)
  const handleEmoji = () => {
    setInput((prev) => prev + "😊");
  };

  // Share chat handler
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "ChatGPT Conversation",
        text: messages.map(m => `${m.role === "user" ? "You" : "ChatGPT"}: ${m.content}`).join("\n")
      });
    } else {
      navigator.clipboard.writeText(messages.map(m => `${m.role === "user" ? "You" : "ChatGPT"}: ${m.content}`).join("\n"));
      alert("Chat copied to clipboard!");
    }
  };

  // New chat handler
  function handleNewChat() {
    // Only save if there are messages in the current chat
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const newHistory: ChatHistory = {
        id: chatId || Date.now().toString(),
        title: currentChatTitle || "New chat",
        lastMessage: lastMsg.content,
        timestamp: lastMsg.timestamp ? new Date(lastMsg.timestamp) : new Date(),
        messages: messages,
      };
      setChatHistory((prev) => [newHistory, ...prev]);
    }
    setChatId(null);
    setMessages([]);
    setInput("");
    setCurrentChatTitle("New chat");
  }

  // Switch chat from sidebar
  function handleSwitchChat(chat: ChatHistory) {
    setChatId(chat.id);
    setMessages(chat.messages);
    setCurrentChatTitle(chat.title);
  }

  // Edit chat title
  function handleEditChatTitle(chat: ChatHistory) {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  }

  function handleEditTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditingTitle(e.target.value);
  }

  function handleEditTitleSave(chat: ChatHistory) {
    setChatHistory((prev) =>
      prev.map((c) =>
        c.id === chat.id ? { ...c, title: editingTitle } : c
      )
    );
    setEditingChatId(null);
    setEditingTitle("");
  }

  function handleDeleteChat(chatIdToDelete: string) {
    setChatHistory((prev) => prev.filter((c) => c.id !== chatIdToDelete));
    if (chatId === chatIdToDelete) {
      setChatId(null);
      setMessages([]);
      setCurrentChatTitle("New chat");
      setInput("");
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome screen (no suggestion cards)
  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="mb-8">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 mx-auto">
          <MessageSquare className="w-8 h-8 text-gray-800" />
        </div>
        <h1 className="text-3xl font-semibold text-white mb-2">
          How can I help you today?
        </h1>
        <p className="text-gray-400 text-lg">
          Ask me anything about generating exam timetables
        </p>
      </div>
    </div>
  );

  // Sidebar items (replicating ChatGPT)
  const sidebarItems = [
    { icon: <User className="w-4 h-4" />, label: "Upgrade plan", onClick: () => alert("Upgrade coming soon!") },
    { icon: <Settings className="w-4 h-4" />, label: "Settings", onClick: () => alert("Settings coming soon!") },
    { icon: <LogOut className="w-4 h-4" />, label: "Log out", onClick: () => alert("Log out coming soon!") },
  ];

  return (
    <div className="flex h-screen w-full bg-[#212121] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#171717] flex flex-col border-r border-[#2f2f2f] transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-semibold text-white">Exam Scheduler</h2>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-[#2f2f2f] rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <button
            onClick={handleNewChat}
            className={cn(
              "w-full flex items-center gap-3 p-3 bg-[#2f2f2f] hover:bg-[#3f3f3f] rounded-lg transition-colors text-white",
              sidebarCollapsed && "justify-center"
            )}
          >
            <Plus className="w-4 h-4" />
            {!sidebarCollapsed && <span>New chat</span>}
          </button>
        </div>
        {/* Chat History */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleSwitchChat(chat)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-[#2f2f2f] rounded-lg transition-colors group",
                    chatId === chat.id && "bg-[#232323]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        <input
                          value={editingTitle}
                          onChange={handleEditTitleChange}
                          onBlur={() => handleEditTitleSave(chat)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleEditTitleSave(chat);
                          }}
                          className="bg-transparent border-b border-gray-500 text-white text-sm font-medium outline-none w-full"
                          autoFocus
                        />
                      ) : (
                        <p className="text-white text-sm font-medium truncate">
                          {chat.title}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <span
                        className="p-1 hover:bg-[#4f4f4f] rounded cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          handleEditChatTitle(chat);
                        }}
                        title="Edit title"
                      >
                        <Edit3 className="w-3 h-3 text-gray-400" />
                      </span>
                      <span
                        className="p-1 hover:bg-[#4f4f4f] rounded cursor-pointer"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3 text-gray-400" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Bottom section */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-[#2f2f2f]">
            {sidebarItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 hover:bg-[#2f2f2f] rounded-lg cursor-pointer"
                onClick={item.onClick}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 h-full relative">
        {/* Header */}
        <div className="h-14 bg-[#212121] border-b border-[#2f2f2f] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-medium">{currentChatTitle}</h3>
            <span className="text-xs bg-[#2f2f2f] text-gray-300 px-2 py-1 rounded-full">
              3.5
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#2f2f2f] rounded-lg transition-colors" onClick={handleShare}>
              <Share className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        {/* Messages Area */}
        <section className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "mb-8 group flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className="flex gap-4 max-w-[80%]">
                    {/* Avatar */}
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-[#10a37f] rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    {/* Message Content */}
                    <div className={cn(
                      "flex-1 min-w-0",
                      msg.role === "user" ? "text-right" : "text-left"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium text-sm">
                          {msg.role === "user" ? "You" : "ChatGPT"}
                        </span>
                        {msg.timestamp && (
                          <span className="text-gray-500 text-xs">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <div className="text-gray-100 leading-relaxed">
                          {msg.fileUrl ? (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">{msg.content}</a>
                          ) : (
                            <ReactMarkdown
                              components={{
                                code: ({ className, children, ...props }: any) => {
                                  const isInline = !className || !className.includes('language-');
                                  if (isInline) {
                                    return (
                                      <code className="bg-[#2f2f2f] px-1 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <pre className="bg-[#1a1a1a] p-4 rounded-lg overflow-x-auto">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  );
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                      {/* Message Actions */}
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity relative">
                          <button
                            className="p-1 hover:bg-[#2f2f2f] rounded transition-colors relative"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              setCopiedMsgId(msg.id);
                              setTimeout(() => setCopiedMsgId(null), 1200);
                            }}
                            title="Copy"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                            {copiedMsgId === msg.id && (
                              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 text-xs bg-[#232323] text-white px-2 py-1 rounded shadow">
                                Copied
                              </span>
                            )}
                          </button>
                          <button
                            className="p-1 hover:bg-[#2f2f2f] rounded transition-colors"
                            onClick={() => alert("Thanks for your feedback!")}
                            title="Thumbs up"
                          >
                            <ThumbsUp className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            className="p-1 hover:bg-[#2f2f2f] rounded transition-colors"
                            onClick={() => alert("Thanks for your feedback!")}
                            title="Thumbs down"
                          >
                            <ThumbsDown className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            className="p-1 hover:bg-[#2f2f2f] rounded transition-colors"
                            onClick={() => {
                              // Regenerate: resend last user message
                              const lastUserMsg = messages.slice().reverse().find(m => m.role === "user");
                              if (lastUserMsg) {
                                setInput(lastUserMsg.content);
                              }
                            }}
                            title="Regenerate"
                          >
                            <RotateCcw className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    {/* User avatar on right */}
                    {msg.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">A</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Loading indicator */}
              {isSending && (
                <div className="mb-8 flex justify-start">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-[#10a37f] rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium text-sm">ChatGPT</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>
        {/* Input Area */}
        <div className="p-4 bg-[#212121]">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="flex items-end gap-3 bg-[#2f2f2f] rounded-3xl p-3 border border-[#4f4f4f] focus-within:border-[#565656]">
                {/* Attachment button */}
                <button
                  className="p-2 hover:bg-[#4f4f4f] rounded-lg transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="*"
                  onChange={handleFileUpload}
                />
                {/* Emoji button */}
                <button
                  className="p-2 hover:bg-[#4f4f4f] rounded-lg transition-colors"
                  onClick={handleEmoji}
                  aria-label="Emoji"
                >
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
                {/* Text input */}
                <div className="flex-1">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && chatId !== null) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Message ChatGPT..."
                    disabled={chatId === null}
                    className="w-full resize-none bg-transparent text-white placeholder-gray-400 border-none focus:outline-none focus:ring-0 min-h-[24px] max-h-32 py-2"
                    rows={1}
                    style={{ 
                      height: 'auto',
                      minHeight: '24px'
                    }}
                  />
                </div>
                {/* Voice input button */}
                <button
                  className="p-2 hover:bg-[#4f4f4f] rounded-lg transition-colors"
                  onClick={handleVoiceInput}
                  aria-label="Voice input"
                >
                  <Mic className="w-5 h-5 text-gray-400" />
                </button>
                {/* Send button */}
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || chatId === null || isSending}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    input.trim() && !isSending
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-[#4f4f4f] text-gray-500 cursor-not-allowed"
                  )}
                  aria-label="Send"
                >
                  {isSending ? (
                    <Square className="w-5 h-5" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {/* Footer text */}
            <p className="text-center text-xs text-gray-500 mt-3">
              ChatGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
