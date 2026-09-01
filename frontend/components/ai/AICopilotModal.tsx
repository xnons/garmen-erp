'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Bot, User, ShieldAlert, TrendingUp, Cpu, Factory,
  FileText, Camera, Upload, CheckCircle2, AlertTriangle, RefreshCw, Copy, Check
} from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser?: any;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  activeUser
}) => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'AUTOFILL' | 'VISION'>('CHAT');
  const [selectedPersona, setSelectedPersona] = useState<'EXECUTIVE' | 'FINANCE' | 'PRODUCTION' | 'SECURITY'>('EXECUTIVE');
  
  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Halo ${activeUser?.nama || 'Owner'}! Saya adalah **Master Garment Enterprise AI Co-Pilot** bertenaga **Claude Sonnet 5**. Saya memiliki akses ke data live Sales Order, pergerakan subkon, stok gudang, dan upah borongan pabrik. Apa yang ingin Anda analisis hari ini?`
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-Fill States
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  // 1. CHAT SUBMISSION
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsChatLoading(true);

    try {
      const res = await axios.post(
        '/api/ai/chat',
        {
          prompt: textToSend,
          persona: selectedPersona,
          history: messages.map((m) => ({ role: m.role, content: m.content }))
        },
        { headers: authHeaders }
      );

      const aiReply = res.data?.reply || 'Tidak ada respon dari model AI.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiReply }]);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Gagal menghubungi AI.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Terjadi kendala: ${errMsg}` }
      ]);
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
      const res = await axios.post(
        '/api/ai/auto-fill',
        { raw_text: rawText, form_type: formType },
        { headers: authHeaders }
      );
      setParsedResult(res.data?.parsed_data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal memproses parsing AI.');
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

  const handleVisionScan = async () => {
    if (!selectedImage || isVisionLoading) return;
    setIsVisionLoading(true);
    setVisionAnalysis(null);

    try {
      const res = await axios.post(
        '/api/ai/vision-qc',
        {
          image_base64: selectedImage,
          defect_notes: defectNotes
        },
        { headers: authHeaders }
      );
      setVisionAnalysis(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal memproses scan AI Vision.');
    } finally {
      setIsVisionLoading(false);
    }
  };

  const handleCopyJSON = () => {
    if (parsedResult) {
      navigator.clipboard.writeText(JSON.stringify(parsedResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[850px] bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Master Garment AI Co-Pilot
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  Gemini Large-Context
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Asisten Analisis Pabrik, Form Auto-Fill, & AI Vision QC Berbasis Data Live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TAB SELECTOR */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('CHAT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'CHAT'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                💬 Chat Konsultasi
              </button>
              <button
                onClick={() => setActiveTab('AUTOFILL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'AUTOFILL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Auto-Fill Form
              </button>
              <button
                onClick={() => setActiveTab('VISION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'VISION'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📸 Vision QC Scan
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TAB 1: CHAT KONSULTASI MULTI-PERSONA */}
        {/* ================================================================= */}
        {activeTab === 'CHAT' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* PERSONA SELECTOR BAR */}
            <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 shrink-0">Persona AI:</span>
              
              <button
                onClick={() => setSelectedPersona('EXECUTIVE')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPersona === 'EXECUTIVE'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                🏢 Executive Advisor
              </button>

              <button
                onClick={() => setSelectedPersona('FINANCE')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPersona === 'FINANCE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                💰 Finance & Costing
              </button>

              <button
                onClick={() => setSelectedPersona('PRODUCTION')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPersona === 'PRODUCTION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                🏭 PPIC & Production
              </button>

              <button
                onClick={() => setSelectedPersona('SECURITY')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedPersona === 'SECURITY'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                🛡️ Audit & Security Sentinel
              </button>
            </div>

            {/* CHAT MESSAGES STREAM */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/80 shadow-lg'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-slate-800 px-4 py-2.5 rounded-2xl text-xs text-indigo-300 border border-slate-700 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    AI sedang mengolah data live pabrik...
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* QUICK PROMPT CHIPS */}
            <div className="px-6 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] text-slate-500 shrink-0">Saran Cepat:</span>
              <button
                onClick={() => handleSendMessage('Berikan ringkasan status Sales Order aktif dan potensi keterlambatan deadline')}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs whitespace-nowrap border border-slate-700 transition-colors"
              >
                📊 Ringkasan SO & Deadline
              </button>
              <button
                onClick={() => handleSendMessage('Apakah ada selisih maklun subkon atau kebocoran barang hilang hari ini?')}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs whitespace-nowrap border border-slate-700 transition-colors"
              >
                🚨 Cek Selisih Subkon
              </button>
              <button
                onClick={() => handleSendMessage('Bagaimana efisiensi konsumsi kain di meja potong Bu Nani?')}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg text-xs whitespace-nowrap border border-slate-700 transition-colors"
              >
                ✂️ Efisiensi Meja Potong
              </button>
            </div>

            {/* INPUT BAR */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Tanyakan pada ${selectedPersona} AI (misal: "Analisis performa finishing Steam Johan")...`}
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isChatLoading || !inputPrompt.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <Send className="w-4 h-4" />
                Kirim
              </button>
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: AI SMART FORM AUTO-FILL */}
        {/* ================================================================= */}
        {activeTab === 'AUTOFILL' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                AI Smart Form Parser (Anti-Typo & Auto-Extract)
              </h3>
              <p className="text-xs text-slate-400">
                Tempelkan teks mentah dari chat WhatsApp Buyer, Purchase Order fisik, atau lembar potong. AI akan mengekstraknya secara terstruktur menjadi format JSON siap pakai.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* INPUT AREA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Pilih Target Form:</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SALES_ORDER">Sales Order (PPIC)</option>
                    <option value="CUTTING">Meja Potong (Cutting Record)</option>
                  </select>
                </div>

                <textarea
                  rows={9}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Contoh teks mentah:\n"Halo PT Chikal, tolong daftarkan PO baru SO-MG260006 style CARGO PANTS warna BLACK total 600 pcs, size 28=150, 30=250, 32=200 pcs, harga CMT Rp32.000, deadline tgl 20 September 2026."`}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />

                <button
                  onClick={handleAutoFill}
                  disabled={isAutoFillLoading || !rawText.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                >
                  {isAutoFillLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Ekstrak Otomatis dengan AI
                </button>
              </div>

              {/* OUTPUT AREA */}
              <div className="space-y-3 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Hasil Ekstraksi Terstruktur:</label>
                  {parsedResult && (
                    <button
                      onClick={handleCopyJSON}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Tersalin!' : 'Salin JSON'}
                    </button>
                  )}
                </div>

                <div className="flex-1 p-4 bg-slate-950 border border-slate-800 rounded-2xl overflow-auto max-h-[300px]">
                  {parsedResult ? (
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(parsedResult, null, 2)}
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-600">
                      Hasil ekstraksi AI akan muncul di sini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: AI VISION QC SCAN (4-POINT ASTM INSPECTION) */}
        {/* ================================================================= */}
        {activeTab === 'VISION' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="bg-purple-950/30 border border-purple-500/20 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-1">
                <Camera className="w-4 h-4" />
                AI Multimodal Vision — Fabric Defect & ASTM Grading
              </h3>
              <p className="text-xs text-slate-400">
                Unggah atau foto kain yang mengalami cacat (noda minyak, benang putus, bolong jarum). AI Vision akan menganalisis ukuran cacat dan memberikan rekomendasi poin ASTM (1–4 poin).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IMAGE UPLOAD */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {selectedImage ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={selectedImage}
                        alt="Defect Preview"
                        className="max-h-44 rounded-lg object-contain mb-2"
                      />
                      <span className="text-xs text-indigo-400 font-semibold">Klik untuk ganti gambar</span>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center">
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <span className="text-xs text-slate-300 font-bold">Pilih / Foto Cacat Kain</span>
                      <span className="text-[11px] text-slate-500 mt-1">Mendukung format JPG, PNG</span>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={defectNotes}
                  onChange={(e) => setDefectNotes(e.target.value)}
                  placeholder="Catatan tambahan QC (misal: Roll No 04, Lot A, kain puring)..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />

                <button
                  onClick={handleVisionScan}
                  disabled={isVisionLoading || !selectedImage}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                >
                  {isVisionLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  Jalankan Analisis AI Vision ASTM
                </button>
              </div>

              {/* VISION ANALYSIS RESULT */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col">
                <h4 className="text-xs font-bold text-slate-300 mb-3">Hasil Penilaian AI Vision:</h4>
                
                {visionAnalysis ? (
                  <div className="space-y-3 flex-1 overflow-auto text-xs text-slate-300">
                    {visionAnalysis.astm_points && (
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
                        <span className="font-bold text-purple-300">Poin Penalti ASTM:</span>
                        <span className="text-lg font-black text-white">{visionAnalysis.astm_points} Poin</span>
                      </div>
                    )}
                    <pre className="whitespace-pre-wrap font-mono text-slate-300 text-[11px] bg-slate-900 p-3 rounded-xl border border-slate-800">
                      {JSON.stringify(visionAnalysis, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-600 text-center">
                    Unggah foto cacat kain dan klik tombol analisis untuk melihat evaluasi AI Vision.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
