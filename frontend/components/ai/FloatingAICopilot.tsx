'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Bot, User, ShieldAlert, TrendingUp, Cpu, Factory,
  FileText, Camera, Upload, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check,
  Minimize2, Maximize2, MessageSquare, ChevronUp, ChevronDown, Zap, Trash2
} from 'lucide-react';
import api from '@/services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface FloatingAICopilotProps {
  activeUser?: any;
}

const STORAGE_KEY = 'garment_enterprise_ai_chat_v2';

export default function FloatingAICopilot({ activeUser }: FloatingAICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'AUTOFILL' | 'VISION'>('CHAT');
  const [selectedPersona, setSelectedPersona] = useState<'EXECUTIVE' | 'FINANCE' | 'PRODUCTION' | 'SECURITY'>('EXECUTIVE');

  // Chat States with LocalStorage Persistence
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Gagal memuat riwayat chat AI:", e);
      }
    }
    return [
      {
        role: 'assistant',
        content: `Halo ${activeUser?.nama || 'Owner'}! Saya **Master Garment Enterprise AI Co-Pilot** bertenaga Gemini & Claude Large-Context. Saya terhubung langsung dengan live data Sales Order, pergerakan subkon, stok kain, dan upah borongan pabrik. Apa yang ingin Anda analisis hari ini?`
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-save chat history
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error("Gagal menyimpan riwayat chat:", e);
      }
    }
  }, [messages]);

  const handleClearHistory = () => {
    if (confirm("Hapus seluruh riwayat percakapan AI Co-Pilot?")) {
      const initMsg: Message = {
        role: 'assistant',
        content: `Halo ${activeUser?.nama || 'Owner'}! Riwayat percakapan telah dibersihkan. Apa yang ingin Anda analisis hari ini?`
      };
      setMessages([initMsg]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  // Auto-fill States
  const [rawText, setRawText] = useState('');
  const [formType, setFormType] = useState<'SALES_ORDER' | 'CUTTING'>('SALES_ORDER');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [isAutoFillLoading, setIsAutoFillLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Vision QC States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [defectNotes, setDefectNotes] = useState('');
  const [visionAnalysis, setVisionAnalysis] = useState<any>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);

  useEffect(() => {
    if (chatBottomRef.current && isOpen && !isMinimized) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // 1. CHAT SUBMISSION
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsChatLoading(true);

    try {
      const res = await api.post('/api/ai/chat', {
        prompt: textToSend,
        persona: selectedPersona,
        history: messages.map((m) => ({ role: m.role, content: m.content }))
      });

      const aiReply = res.data?.reply || 'Tidak ada respon dari model AI.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (err: any) {
      const isNetworkErr = !err.response || err.message?.includes('Network Error') || err.message?.includes('ERR_FAILED');
      if (isNetworkErr) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⏳ **Backend Sedang Menyambung Ulang (Render Spin-up / Cold-Start)**\n\nLayanan backend cloud sedang dalam proses start/rebuild. Anda tetap dapat menggunakan menu-menu ERP seperti biasa. Silakan tekan tombol kirim kembali dalam beberapa detik.`
          }
        ]);
      } else {
        const errMsg = err.response?.data?.detail || err.message || 'Gagal menghubungi server AI.';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ Terjadi kendala: ${errMsg}` }
        ]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  // 2. AUTO-FILL PARSING
  const handleAutoFill = async () => {
    if (!rawText.trim() || isAutoFillLoading) return;
    setIsAutoFillLoading(true);
    setParsedResult(null);

    try {
      const res = await api.post('/api/ai/auto-fill', {
        raw_text: rawText,
        form_type: formType
      });

      if (res.data?.parsed_data) {
        setParsedResult(res.data.parsed_data);
      } else {
        alert(res.data?.message || 'Gagal mengekstrak teks form.');
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Gagal memproses data dengan AI.');
    } finally {
      setIsAutoFillLoading(false);
    }
  };

  // 3. VISION QC SCAN
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeVision = async () => {
    if (!selectedImage || isVisionLoading) return;
    setIsVisionLoading(true);
    setVisionAnalysis(null);

    try {
      const res = await api.post('/api/ai/vision-qc', {
        image_base64: selectedImage,
        defect_notes: defectNotes
      });

      if (res.data?.analysis) {
        setVisionAnalysis(res.data.analysis);
      } else {
        alert(res.data?.message || 'Gagal menganalisis visual.');
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Gagal memeriksa cacat kain.');
    } finally {
      setIsVisionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Persona Badges Meta
  const personas = [
    {
      id: 'EXECUTIVE',
      label: 'Executive Advisor',
      icon: TrendingUp,
      desc: 'Kapasitas pabrik & strategi deadline',
      color: 'from-amber-500/20 to-orange-500/10 text-amber-300 border-amber-500/30'
    },
    {
      id: 'FINANCE',
      label: 'Finance & Costing',
      icon: Factory,
      desc: 'Margin CMT, upah borongan & Form WI',
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'PRODUCTION',
      label: 'PPIC & Subcon',
      icon: Cpu,
      desc: 'Yield meja potong & bottleneck maklun',
      color: 'from-indigo-500/20 to-blue-500/10 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'SECURITY',
      label: 'Cyber Sentinel',
      icon: ShieldAlert,
      desc: 'Deteksi vendor curang & audit integritas',
      color: 'from-rose-500/20 to-red-500/10 text-rose-300 border-rose-500/30'
    }
  ];

  const quickPrompts = [
    '📊 Berikan ringkasan eksekutif status pabrik hari ini.',
    '⚠️ Apakah ada subkon yang selisih barangnya kritis?',
    '✂️ Bagaimana rata-rata yield konsumsi kain meja potong Bu Nani?',
    '💰 Berapa estimasi tagihan SJP CMT yang belum di-invoice?'
  ];

  return (
    <>
      {/* 🚀 1. FLOATING ACTION BUTTON (TRIGGER) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 rounded-full shadow-2xl text-[11px] text-indigo-300 font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Co-Pilot Online</span>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-500/80 hover:scale-105 active:scale-95 transition-all duration-300 border border-indigo-400/30 cursor-pointer"
            title="Buka Master Garment Enterprise AI Co-Pilot"
          >
            <div className="absolute inset-0 rounded-2xl bg-indigo-400/20 blur-lg group-hover:blur-xl transition-all" />
            <Bot className="w-7 h-7 relative z-10 group-hover:rotate-6 transition-transform" />
            <Sparkles className="w-3.5 h-3.5 absolute top-2 right-2 text-amber-300 z-10 animate-spin" style={{ animationDuration: '8s' }} />
          </button>
        </div>
      )}

      {/* 🌟 2. FLOATING DOCK WINDOW */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 w-auto h-auto'
              : isMinimized
              ? 'bottom-6 right-6 w-80 h-14 rounded-2xl'
              : 'bottom-6 right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[88vh]'
          }`}
        >
          {/* DOCK HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800 shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white tracking-wide">AI CO-PILOT</h3>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-mono font-bold">
                    GEMINI • CLAUDE
                  </span>
                </div>
                {!isMinimized && (
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {personas.find((p) => p.id === selectedPersona)?.label}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!isMinimized && (
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Riwayat Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Perbesar' : 'Minimize'}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {!isMinimized && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={isExpanded ? 'Normal' : 'Layar Penuh'}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Tutup Co-Pilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DOCK BODY (Shown if not minimized) */}
          {!isMinimized && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* TAB SELECTOR */}
              <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1 shrink-0">
                <button
                  onClick={() => setActiveTab('CHAT')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'CHAT'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Live</span>
                </button>

                <button
                  onClick={() => setActiveTab('AUTOFILL')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'AUTOFILL'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Fill Form</span>
                </button>

                <button
                  onClick={() => setActiveTab('VISION')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'VISION'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Vision QC Scan</span>
                </button>
              </div>

              {/* TAB 1: CHAT LIVE */}
              {activeTab === 'CHAT' && (
                <div className="flex flex-col flex-1 overflow-hidden p-3 space-y-3">
                  {/* Persona Chips */}
                  <div className="grid grid-cols-2 gap-1.5 shrink-0">
                    {personas.map((p) => {
                      const Icon = p.icon;
                      const isSelected = selectedPersona === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPersona(p.id as any)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? `bg-gradient-to-r ${p.color} border-current shadow-sm scale-[1.01]`
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <div className="truncate min-w-0">
                            <p className="text-[11px] font-bold truncate leading-tight">{p.label}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div
                          className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                              : 'bg-slate-950/90 text-slate-200 border border-slate-800/90 rounded-tl-sm shadow-sm'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {msg.role === 'user' && (
                          <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isChatLoading && (
                      <div className="flex gap-2.5 items-center text-slate-400 text-xs p-2 bg-slate-950/50 rounded-xl border border-slate-800/60 w-fit">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Menganalisis live database pabrik...</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Quick Prompts Carousel */}
                  <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar shrink-0">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 whitespace-nowrap transition-all cursor-pointer shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2 pt-1 border-t border-slate-800 shrink-0"
                  >
                    <input
                      type="text"
                      placeholder={`Tanya ${personas.find((p) => p.id === selectedPersona)?.label}...`}
                      value={inputPrompt}
                      onChange={(e) => setInputPrompt(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !inputPrompt.trim()}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: SMART AUTO-FILL */}
              {activeTab === 'AUTOFILL' && (
                <div className="flex flex-col flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300">
                    <p className="font-bold flex items-center gap-1.5 text-xs">
                      <Zap className="w-4 h-4" /> AI Smart Form Parser
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Salin teks pesanan dari chat WhatsApp Buyer atau Purchase Order, lalu klik ekstrak.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Form ERP:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormType('SALES_ORDER')}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                          formType === 'SALES_ORDER'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        1. Form Sales Order (SO)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormType('CUTTING')}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition-all ${
                          formType === 'CUTTING'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        2. Form Meja Potong
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Tempel Teks Mentah:</label>
                    <textarea
                      rows={4}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Contoh: 'Tolong buatkan SO Wind Mild Black 500 pcs size 28=100, 30=150, 32=150, 34=100 harga 35rb deadline akhir agustus...'"
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                    />
                  </div>

                  <button
                    onClick={handleAutoFill}
                    disabled={isAutoFillLoading || !rawText.trim()}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isAutoFillLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isAutoFillLoading ? 'Mengekstrak dengan AI...' : 'Ekstrak Otomatis ke Form JSON'}</span>
                  </button>

                  {parsedResult && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Hasil Ekstraksi JSON:
                        </span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(parsedResult, null, 2))}
                          className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Tersalin!' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre className="p-2 bg-slate-900 rounded-lg text-[10px] text-amber-300 font-mono overflow-x-auto max-h-48 border border-slate-800">
                        {JSON.stringify(parsedResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VISION QC SCAN */}
              {activeTab === 'VISION' && (
                <div className="flex flex-col flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300">
                    <p className="font-bold flex items-center gap-1.5 text-xs">
                      <Camera className="w-4 h-4" /> ASTM 4-Point AI Vision Scanner
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Unggah foto cacat kain roll (benang putus, noda, serat belang) untuk dinilai otomatis oleh AI.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Unggah Foto Cacat Kain:</label>
                    <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 text-center bg-slate-950/60 transition-colors">
                      {selectedImage ? (
                        <div className="space-y-2">
                          <img
                            src={selectedImage}
                            alt="Preview Defect"
                            className="max-h-40 mx-auto rounded-lg object-contain border border-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedImage(null)}
                            className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                          >
                            Hapus & Ganti Foto
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block space-y-2">
                          <Upload className="w-8 h-8 text-purple-400 mx-auto" />
                          <p className="text-[11px] text-slate-300 font-medium">Klik untuk upload foto kain dari HP/PC</p>
                          <p className="text-[10px] text-slate-500">Format: JPG, PNG, WEBP (Max 5MB)</p>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Catatan Tambahan (Opsional):</label>
                    <input
                      type="text"
                      placeholder="Contoh: Roll nomor 04, posisi yard ke-12"
                      value={defectNotes}
                      onChange={(e) => setDefectNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleAnalyzeVision}
                    disabled={isVisionLoading || !selectedImage}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isVisionLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{isVisionLoading ? 'Memeriksa Gambar dengan Vision AI...' : 'Analisis Cacat ASTM 4-Point'}</span>
                  </button>

                  {visionAnalysis && (
                    <div className="p-3.5 bg-slate-950 border border-purple-500/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300">Hasil Audit AI Vision:</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono font-bold text-[10px]">
                          Rating: {visionAnalysis.astm_penalty_point_rating || 2} Point
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{visionAnalysis.analysis_summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
