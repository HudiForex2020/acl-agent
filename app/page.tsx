"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  Plus,
  Info,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Lightbulb,
  ShieldCheck,
  Users,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatApiResponse {
  reply?: string;
  interaction_id?: string | null;
  conversation_id?: string | null;
  references?: unknown[];
  error?: string;
}

interface StarterPrompt {
  icon: React.ReactNode;
  badge: string;
  text: string;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    icon: <Calendar className="w-4 h-4 text-indigo-400" />,
    badge: "Jadwal",
    text: "Jadwal mentoring saya kapan?",
  },
  {
    icon: <Lightbulb className="w-4 h-4 text-violet-400" />,
    badge: "Kurikulum",
    text: "Apa materi di Week 7 Vibecoding?",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    badge: "Garansi",
    text: "Syarat klaim garansi 100% agent berjalan apa saja?",
  },
  {
    icon: <Users className="w-4 h-4 text-amber-400" />,
    badge: "Mentor",
    text: "Siapa saja mentor di kelas Beginner dan Intermediate?",
  },
];

export default function ACLAgentChatroom() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentInteractionId, setCurrentInteractionId] = useState<string | null>(
    null
  );
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 132;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [input]);

  const formatTime = (): string => {
    return new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentInteractionId(null);
    setErrorBanner(null);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleCopyResponse = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err: unknown) {
      console.error("Gagal menyalin teks:", err);
    }
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend || isLoading) return;

    setErrorBanner(null);
    if (!overrideText) {
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          lastInteractionId: currentInteractionId,
        }),
      });

      const data = (await res.json()) as ChatApiResponse;

      if (!res.ok) {
        throw new Error(
          data.error || `Terjadi kesalahan jaringan (HTTP ${res.status})`
        );
      }

      if (data.interaction_id) {
        setCurrentInteractionId(data.interaction_id);
      }

      const assistantMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "assistant",
        content:
          data.reply ||
          "Maaf, ACL Agent tidak memberikan jawaban. Silakan coba lagi.",
        timestamp: formatTime(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error
          ? error.message
          : "Gagal terhubung ke server ACL Agent. Periksa koneksi internet Anda.";
      setErrorBanner(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white truncate">
                  ACL Agent
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Online
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                AI Creator Labs • Learning Companion & Bootcamp Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleNewChat}
              title="Mulai Percakapan Baru"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              title="Informasi ACL Agent"
              aria-label="Informasi ACL Agent"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center mb-5 shadow-xl shadow-indigo-950/30">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2.5">
                Halo Builder! Ada yang bisa dibantu seputar AI Builder Bootcamp?
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-xl mb-8 leading-relaxed">
                Tanyakan jadwal live mentoring, silabus materi mingguan, teknis
                pembuatan AI Agent, hingga syarat garansi program langsung dari
                asisten resmi AI Creator Labs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => void handleSendMessage(item.text)}
                    disabled={isLoading}
                    className="group p-4 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/90 hover:border-indigo-500/50 transition-all duration-200 flex flex-col gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 group-hover:text-indigo-300 transition-colors">
                      {item.icon}
                      <span>{item.badge}</span>
                    </div>
                    <p className="text-sm text-zinc-200 group-hover:text-white font-medium leading-snug">
                      {item.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-500/10">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={
                          isUser
                            ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-md shadow-indigo-950/30 whitespace-pre-wrap"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm leading-relaxed shadow-sm w-full"
                        }
                      >
                        {isUser ? (
                          msg.content
                        ) : (
                          <div className="markdown-body space-y-3 break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="leading-relaxed last:mb-0">
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-white">
                                    {children}
                                  </strong>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-5 space-y-1.5 text-zinc-200">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-5 space-y-1.5 text-zinc-200">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-relaxed">{children}</li>
                                ),
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                                  >
                                    {children}
                                  </a>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-2 border-indigo-500 pl-3 py-0.5 italic text-zinc-300 bg-zinc-950/40 rounded-r">
                                    {children}
                                  </blockquote>
                                ),
                                code: ({ className, children, ...props }) => {
                                  const isBlock =
                                    Boolean(className) ||
                                    String(children).includes("\n");
                                  if (isBlock) {
                                    return (
                                      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-x-auto text-xs font-mono text-zinc-200 my-2">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    );
                                  }
                                  return (
                                    <code
                                      className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-2 rounded-lg border border-zinc-800">
                                    <table className="w-full text-left border-collapse text-xs">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-zinc-950 text-zinc-200 border-b border-zinc-800">
                                    {children}
                                  </thead>
                                ),
                                th: ({ children }) => (
                                  <th className="px-3 py-2 font-semibold">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-3 py-2 border-t border-zinc-800/80 text-zinc-300">
                                    {children}
                                  </td>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 px-1">
                        <span className="text-[11px] text-zinc-500">
                          {msg.timestamp}
                        </span>
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyResponse(msg.id, msg.content)
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">
                                  Tersalin
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy response</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
                    </div>
                    <span className="text-xs text-zinc-400 animate-pulse">
                      ACL Agent sedang mencari materi & berpikir...
                    </span>
                  </div>
                </div>
              )}

              {errorBanner && (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorBanner(null)}
                    className="text-red-400 hover:text-red-200 p-1 cursor-pointer"
                    aria-label="Tutup peringatan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-3 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 bg-zinc-900/95 border border-zinc-800 focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl p-2 shadow-xl shadow-black/40 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pertanyaan seputar materi, jadwal, atau teknis AI Builder Bootcamp..."
              disabled={isLoading}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 px-3 py-2 resize-none focus:outline-none max-h-[132px] overflow-y-auto leading-relaxed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleSendMessage()}
              disabled={!input.trim() || isLoading}
              aria-label="Kirim pesan"
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-center text-zinc-500 mt-2.5">
            ACL Agent dapat membuat kesalahan. Selalu verifikasi jadwal resmi
            dan materi unduhan di LMS:{" "}
            <a
              href="https://learn.aicreatorlabs.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-indigo-400 underline underline-offset-2 transition-colors"
            >
              learn.aicreatorlabs.id
            </a>
          </p>
        </div>
      </footer>

      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Tentang ACL Agent
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Official AI Companion • AI Creator Labs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-zinc-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>ACL Agent</strong> adalah asisten pembelajaran dan
                layanan peserta resmi untuk program{" "}
                <span className="text-indigo-400 font-medium">
                  AI Builder Bootcamp
                </span>{" "}
                yang ditenagai oleh platform <strong>Lumagen</strong>.
              </p>
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
                <p className="font-medium text-zinc-200">Cakupan Bantuan:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Jadwal sesi live mentoring & konsultasi</li>
                  <li>Panduan kurikulum (Beginner hingga Intermediate)</li>
                  <li>Informasi teknis Vibecoding & deployment AI Agent</li>
                  <li>Syarat & ketentuan garansi program bootcamp</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-800">
              <a
                href="https://learn.aicreatorlabs.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"
              >
                <span>Buka Portal LMS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
