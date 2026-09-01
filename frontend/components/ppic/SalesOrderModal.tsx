"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Building2, User, 
  Phone, Mail, MapPin, DollarSign, Calendar, FileText, Layers, Scissors, 
  Tag, Info, Calculator, CreditCard, Clock, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { usePrompt } from '@/components/common/ConfirmDialog';
import { errMsg } from '@/utils/format';

interface SalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function SalesOrderModal({ isOpen, onClose, onSuccess, initialData }: SalesOrderModalProps) {
  const promptDialog = usePrompt();
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState<'MAIN' | 'FINANCE' | 'SIZES' | 'BOM' | 'SPECS'>('MAIN');

  const [buyers, setBuyers] = useState<any[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    so_number: "",
    buyer_id: "",
    buyer_po_number: "",
    customer_pic_name: "",
    customer_pic_phone: "",
    customer_email: "",
    delivery_address: "",
    style_name: "",
    item_category: "LONG JEANS",
    color: "BLACK",
    fabric_type: "Denim 13.5 Oz Non-Stretch",
    target_shrinkage_pct: 3.0,
    special_instructions: "",
    contract_type: "CMT",
    order_qty: 500,
    unit_price: 35000,
    total_order_value: 0,
    dp_amount: 0,
    payment_terms: "NET_30",
    tax_ppn_pct: 0,
    discount_amount: 0,
    order_date: new Date().toISOString().split('T')[0],
    deadline: ""
  });

  // Size type: Numeric (28..40) or Alpha (S..3XL)
  const [sizeType, setSizeType] = useState<'NUMERIC' | 'ALPHA'>('NUMERIC');
  const [sizeMatrix, setSizeMatrix] = useState<Record<string, number>>({
    "28": 100,
    "30": 150,
    "32": 150,
    "34": 100
  });

  // BOM Accessories
  const [bomList, setBomList] = useState<{ item: string; qty_per_pcs: number }[]>([
    { item: "Kancing Utama Logam", qty_per_pcs: 1 },
    { item: "Resleting Kuningan YKK 5-inch", qty_per_pcs: 1 },
    { item: "Label Woven Merk", qty_per_pcs: 1 }
  ]);

  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // State Tambah Buyer / Brand Baru Dinamis
  const [showNewBuyerModal, setShowNewBuyerModal] = useState<boolean>(false);
  const [newBuyerName, setNewBuyerName] = useState<string>("");
  const [newBuyerPhone, setNewBuyerPhone] = useState<string>("");
  const [newBuyerAddress, setNewBuyerAddress] = useState<string>("");
  const [creatingBuyer, setCreatingBuyer] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchBuyers();
      if (initialData) {
        setFormData({
          so_number: initialData.so_number || "",
          buyer_id: initialData.buyer_id || "",
          buyer_po_number: initialData.buyer_po_number || "",
          customer_pic_name: initialData.customer_pic_name || "",
          customer_pic_phone: initialData.customer_pic_phone || "",
          customer_email: initialData.customer_email || "",
          delivery_address: initialData.delivery_address || "",
          style_name: initialData.style_name || "",
          item_category: initialData.item_category || "LONG JEANS",
          color: initialData.color || "BLACK",
          fabric_type: initialData.fabric_type || "Denim 13.5 Oz Non-Stretch",
          target_shrinkage_pct: initialData.target_shrinkage_pct ?? 3.0,
          special_instructions: initialData.special_instructions || "",
          contract_type: initialData.contract_type || "CMT",
          order_qty: initialData.order_qty || 0,
          unit_price: initialData.unit_price || 35000,
          total_order_value: initialData.total_order_value || 0,
          dp_amount: initialData.dp_amount || 0,
          payment_terms: initialData.payment_terms || "NET_30",
          tax_ppn_pct: initialData.tax_ppn_pct || 0,
          discount_amount: initialData.discount_amount || 0,
          order_date: initialData.order_date || new Date().toISOString().split('T')[0],
          deadline: initialData.deadline || ""
        });
        if (initialData.size_breakdown_target && Object.keys(initialData.size_breakdown_target).length > 0) {
          setSizeMatrix(initialData.size_breakdown_target);
        }
        if (initialData.bom_accessories && Array.isArray(initialData.bom_accessories) && initialData.bom_accessories.length > 0) {
          setBomList(initialData.bom_accessories);
        }
      } else {
        // Reset form for create
        const randomNum = Math.floor(Math.random() * 9000 + 1000);
        setFormData({
          so_number: `SO-MG26${randomNum}`,
          buyer_id: "",
          buyer_po_number: "",
          customer_pic_name: "",
          customer_pic_phone: "",
          customer_email: "",
          delivery_address: "",
          style_name: "",
          item_category: "LONG JEANS",
          color: "BLACK",
          fabric_type: "Denim 13.5 Oz Non-Stretch",
          target_shrinkage_pct: 3.0,
          special_instructions: "",
          contract_type: "CMT",
          order_qty: 500,
          unit_price: 35000,
          total_order_value: 0,
          dp_amount: 0,
          payment_terms: "NET_30",
          tax_ppn_pct: 0,
          discount_amount: 0,
          order_date: new Date().toISOString().split('T')[0],
          deadline: ""
        });
        setSizeMatrix({ "28": 100, "30": 150, "32": 150, "34": 100 });
        setBomList([
          { item: "Kancing Utama Logam", qty_per_pcs: 1 },
          { item: "Resleting Kuningan YKK 5-inch", qty_per_pcs: 1 },
          { item: "Label Woven Merk", qty_per_pcs: 1 }
        ]);
      }
      setActiveTab('MAIN');
    }
  }, [isOpen, initialData]);

  const fetchBuyers = async () => {
    setLoadingBuyers(true);
    try {
      const res = await api.get('/api/ppic/partners?category=BUYER');
      setBuyers(res.data || []);
      if (res.data && res.data.length > 0 && !formData.buyer_id && !initialData) {
        const firstBuyer = res.data[0];
        setFormData(prev => ({
          ...prev,
          buyer_id: firstBuyer.id,
          customer_pic_phone: prev.customer_pic_phone || firstBuyer.phone || "",
          delivery_address: prev.delivery_address || firstBuyer.address || ""
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil daftar buyer:", err);
    } finally {
      setLoadingBuyers(false);
    }
  };

  const handleSelectBuyer = (buyerId: string) => {
    const selected = buyers.find(b => b.id === buyerId);
    setFormData(prev => ({
      ...prev,
      buyer_id: buyerId,
      customer_pic_phone: selected?.phone || prev.customer_pic_phone,
      delivery_address: selected?.address || prev.delivery_address
    }));
  };

  const handleCreateNewBuyer = async () => {
    if (!newBuyerName.trim()) {
      toast.warning("Nama Brand / Buyer tidak boleh kosong.");
      return;
    }
    setCreatingBuyer(true);
    try {
      const randomNum = Math.floor(Math.random() * 900 + 100);
      const code = `BYR-${newBuyerName.trim().substring(0, 3).toUpperCase()}${randomNum}`;
      const res = await api.post('/api/ppic/partners', {
        name: newBuyerName.trim().toUpperCase(),
        code: code,
        category: 'BUYER',
        phone: newBuyerPhone || null,
        address: newBuyerAddress || null
      });
      const created = res.data;
      setBuyers(prev => [...prev, created]);
      setFormData(prev => ({
        ...prev,
        buyer_id: created.id,
        customer_pic_phone: created.phone || prev.customer_pic_phone,
        delivery_address: created.address || prev.delivery_address
      }));
      setShowNewBuyerModal(false);
      setNewBuyerName("");
      setNewBuyerPhone("");
      setNewBuyerAddress("");
    } catch (err: any) {
      toast.error(errMsg(err, "Gagal menambahkan brand baru."));
    } finally {
      setCreatingBuyer(false);
    }
  };

  const handleSizeTypeSwitch = (type: 'NUMERIC' | 'ALPHA') => {
    setSizeType(type);
    if (type === 'NUMERIC') {
      setSizeMatrix({ "28": 100, "30": 150, "32": 150, "34": 100 });
    } else {
      setSizeMatrix({ "S": 50, "M": 150, "L": 200, "XL": 100 });
    }
  };

  const handleSizeQtyChange = (sizeKey: string, val: number) => {
    setSizeMatrix(prev => ({
      ...prev,
      [sizeKey]: Math.max(0, val)
    }));
  };

  const handleAddSizeKey = async () => {
    const newKey = await promptDialog({
      title: "Tambah ukuran",
      label: "Nama ukuran",
      placeholder: "mis. 36, XXL, ALL SIZE",
    });
    if (newKey) {
      setSizeMatrix(prev => ({ ...prev, [newKey.toUpperCase()]: 0 }));
    }
  };

  const handleRemoveSizeKey = (key: string) => {
    const copy = { ...sizeMatrix };
    delete copy[key];
    setSizeMatrix(copy);
  };

  const totalCalculatedQty = useMemo(() => {
    return Object.values(sizeMatrix).reduce((acc, q) => acc + (Number(q) || 0), 0);
  }, [sizeMatrix]);

  // Financial calculations
  const financialSummary = useMemo(() => {
    const qty = totalCalculatedQty;
    const price = Number(formData.unit_price) || 0;
    const subtotal = qty * price;
    const disc = Number(formData.discount_amount) || 0;
    const taxableAmount = Math.max(0, subtotal - disc);
    const taxPct = Number(formData.tax_ppn_pct) || 0;
    const taxValue = (taxableAmount * taxPct) / 100;
    const grandTotal = taxableAmount + taxValue;
    const dp = Number(formData.dp_amount) || 0;
    const remainingBalance = Math.max(0, grandTotal - dp);

    return {
      subtotal,
      discount: disc,
      taxableAmount,
      taxValue,
      grandTotal,
      dp,
      remainingBalance
    };
  }, [totalCalculatedQty, formData.unit_price, formData.discount_amount, formData.tax_ppn_pct, formData.dp_amount]);

  const handleAddBomItem = () => {
    setBomList(prev => [...prev, { item: "", qty_per_pcs: 1 }]);
  };

  const handleRemoveBomItem = (idx: number) => {
    setBomList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBomChange = (idx: number, field: string, val: any) => {
    setBomList(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.so_number.trim()) {
      setErrorMsg("Nomor Sales Order (Code SO) wajib diisi.");
      return;
    }
    if (!formData.style_name.trim()) {
      setErrorMsg("Nama Style / Model garmen wajib diisi.");
      return;
    }
    if (totalCalculatedQty <= 0) {
      setErrorMsg("Total kuantitas breakdown ukuran harus lebih dari 0 pcs.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        so_number: formData.so_number.toUpperCase().trim(),
        buyer_id: formData.buyer_id || null,
        buyer_po_number: formData.buyer_po_number ? formData.buyer_po_number.trim().toUpperCase() : null,
        customer_pic_name: formData.customer_pic_name ? formData.customer_pic_name.trim() : null,
        customer_pic_phone: formData.customer_pic_phone ? formData.customer_pic_phone.trim() : null,
        customer_email: formData.customer_email ? formData.customer_email.trim() : null,
        delivery_address: formData.delivery_address ? formData.delivery_address.trim() : null,
        style_name: formData.style_name.toUpperCase().trim(),
        item_category: formData.item_category,
        color: formData.color.toUpperCase().trim(),
        fabric_type: formData.fabric_type ? formData.fabric_type.trim() : null,
        target_shrinkage_pct: Number(formData.target_shrinkage_pct) || 0.0,
        special_instructions: formData.special_instructions ? formData.special_instructions.trim() : null,
        contract_type: formData.contract_type,
        order_qty: totalCalculatedQty,
        unit_price: Number(formData.unit_price) || 0,
        total_order_value: financialSummary.grandTotal,
        dp_amount: Number(formData.dp_amount) || 0,
        payment_terms: formData.payment_terms,
        tax_ppn_pct: Number(formData.tax_ppn_pct) || 0,
        discount_amount: Number(formData.discount_amount) || 0,
        size_breakdown_target: sizeMatrix,
        bom_accessories: bomList.filter(b => b.item.trim().length > 0),
        order_date: formData.order_date,
        deadline: formData.deadline || null
      };

      if (isEditing) {
        await api.put(`/api/ppic/orders/${initialData.id}`, payload);
      } else {
        await api.post('/api/ppic/orders', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Gagal menyimpan Sales Order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {isEditing ? `Edit Sales Order: ${formData.so_number}` : 'Registrasi Sales Order Baru (PPIC)'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  formData.contract_type === 'FOB' 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                }`}>
                  KONTRAK {formData.contract_type}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lengkapi data komersial, identitas Buyer, harga kontrak, breakdown ukuran, dan spesifikasi garmen.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('MAIN')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'MAIN'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Data Pokok & Customer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FINANCE')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'FINANCE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>2. Harga & Finansial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SIZES')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SIZES'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>3. Matriks Ukuran ({totalCalculatedQty} Pcs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BOM')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'BOM'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>4. BOM Aksesoris ({bomList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SPECS')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SPECS'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>5. Spesifikasi Teknis</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-rose-400 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM CONTENT (SCROLLABLE) */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            
            {/* TAB 1: DATA POKOK & CUSTOMER INFO */}
            {activeTab === 'MAIN' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wider">
                    <Tag className="w-4 h-4" />
                    Identitas Sales Order & Referensi PO
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Nomor SO (Code SO) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="SO-MG260004"
                        value={formData.so_number}
                        onChange={(e) => setFormData({ ...formData, so_number: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        No. PO Fisik Buyer / Brand
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: PO-ZARA-2026/089"
                        value={formData.buyer_po_number}
                        onChange={(e) => setFormData({ ...formData, buyer_po_number: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold">
                          Buyer / Brand Pemesan <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowNewBuyerModal(true)}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          + Brand Baru
                        </button>
                      </div>
                      <select
                        value={formData.buyer_id}
                        onChange={(e) => handleSelectBuyer(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                      >
                        <option value="">-- Pilih Brand / Buyer --</option>
                        {buyers.map((b) => (
                          <option key={b.id} value={b.id}>{b.name} ({b.code || 'NO-CODE'})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Contact & Delivery Info */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                    <User className="w-4 h-4" />
                    Kontak Merchandiser & Gudang Pengiriman
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Nama PIC / Merchandiser Buyer
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Contoh: Ibu Maya (Merchandiser)"
                          value={formData.customer_pic_name}
                          onChange={(e) => setFormData({ ...formData, customer_pic_name: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9.5 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        No. WhatsApp / Telepon PIC
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="081234567890"
                          value={formData.customer_pic_phone}
                          onChange={(e) => setFormData({ ...formData, customer_pic_phone: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9.5 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Email Buyer
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          placeholder="buyer@brandfashion.com"
                          value={formData.customer_email}
                          onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9.5 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Alamat Lengkap Gudang Pengiriman (Destination Address)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <textarea
                        rows={2}
                        placeholder="Contoh: Gudang Logistik PT. Delusi Fashion, Kawasan Industri Jababeka Blok C-12, Cikarang"
                        value={formData.delivery_address}
                        onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9.5 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Style & Item Info */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                    <Scissors className="w-4 h-4" />
                    Spesifikasi Model & Jadwal Deadline
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Nama Style / Model Garmen <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: WIND MILD BLACK JEANS"
                        value={formData.style_name}
                        onChange={(e) => setFormData({ ...formData, style_name: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Kategori Garmen
                      </label>
                      <select
                        value={formData.item_category}
                        onChange={(e) => setFormData({ ...formData, item_category: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="LONG JEANS">LONG JEANS (Celana Panjang)</option>
                        <option value="SHORT JEANS">SHORT JEANS (Celana Pendek)</option>
                        <option value="SS KEMEJA">SS KEMEJA (Lengan Pendek)</option>
                        <option value="LS KEMEJA">LS KEMEJA (Lengan Panjang)</option>
                        <option value="CHINO">CELANA CHINO</option>
                        <option value="CARGO">CELANA CARGO</option>
                        <option value="OUTER">JAKET / OUTER</option>
                        <option value="POLO SHIRT">KAOS POLO</option>
                        <option value="TSHIRT">KAOS T-SHIRT / O-NECK</option>
                        <option value="LAINNYA">LAINNYA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Warna Utama
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: BLACK / NAVY / KHAKI"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Tanggal Registrasi PO
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.order_date}
                        onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Target Deadline Pengiriman SJP <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HARGA & FINANSIAL */}
            {activeTab === 'FINANCE' && (
              <div className="space-y-5">
                {/* Contract Type & Terms */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4" />
                    Struktur Biaya Kontrak & Termin Pembayaran
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Skema Kontrak Produksi
                      </label>
                      <select
                        value={formData.contract_type}
                        onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
                      >
                        <option value="CMT">CMT (Cut - Make - Trim / Kain dari Buyer)</option>
                        <option value="FOB">FOB (Full Order Buying / Bahan dari Pabrik)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Harga Satuan ({formData.contract_type === 'FOB' ? 'Harga FOB' : 'Tarif Jasa CMT'}) (Rp/Pcs) <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={formData.unit_price}
                          onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Termin Pembayaran (Payment Terms)
                      </label>
                      <select
                        value={formData.payment_terms}
                        onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="CBD">CBD (Cash Before Delivery)</option>
                        <option value="NET_14">Net 14 Hari setelah SJP</option>
                        <option value="NET_30">Net 30 Hari setelah Faktur Form WI</option>
                        <option value="NET_45">Net 45 Hari</option>
                        <option value="DP_50_PELUNASAN">DP 50% saat PO, Pelunasan saat Kirim</option>
                        <option value="KREDIT_60">Kredit 60 Hari</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Uang Muka / DP Disetor Buyer (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.dp_amount}
                          onChange={(e) => setFormData({ ...formData, dp_amount: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Potongan Diskon Khusus Kontrak (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.discount_amount}
                          onChange={(e) => setFormData({ ...formData, discount_amount: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Pajak Pertambahan Nilai (PPN %)
                      </label>
                      <select
                        value={formData.tax_ppn_pct}
                        onChange={(e) => setFormData({ ...formData, tax_ppn_pct: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value={0}>Non-PPN (0%)</option>
                        <option value={11}>PPN 11%</option>
                        <option value={12}>PPN 12%</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                      <Calculator className="w-4 h-4" />
                      Kalkulasi Otomatis Nilai Kontrak Sales Order
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      {totalCalculatedQty} PCS TOTAL
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <p className="text-slate-400 text-[11px]">Subtotal Kotor</p>
                      <p className="text-sm font-bold text-white font-mono mt-0.5">
                        Rp {financialSummary.subtotal.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <p className="text-slate-400 text-[11px]">Diskon & PPN ({formData.tax_ppn_pct}%)</p>
                      <p className="text-sm font-bold text-slate-300 font-mono mt-0.5">
                        +Rp {financialSummary.taxValue.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40">
                      <p className="text-emerald-300 text-[11px] font-bold">Total Nilai Order (Grand Total)</p>
                      <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                        Rp {financialSummary.grandTotal.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <p className="text-slate-400 text-[11px]">Sisa Piutang (Setelah DP)</p>
                      <p className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                        Rp {financialSummary.remainingBalance.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MATRIKS UKURAN */}
            {activeTab === 'SIZES' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2 uppercase tracking-wider">
                      <Scissors className="w-4 h-4" />
                      Rincian Matriks Ukuran (Size Breakdown)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tentukan alokasi target potong dan jahit untuk masing-masing ukuran garmen.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-slate-900 border border-slate-700 p-0.5 rounded-xl flex">
                      <button
                        type="button"
                        onClick={() => handleSizeTypeSwitch('NUMERIC')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          sizeType === 'NUMERIC' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Celana (28-40)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSizeTypeSwitch('ALPHA')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          sizeType === 'ALPHA' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Atasan (S-3XL)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSizeKey}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Ukuran
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Object.entries(sizeMatrix).map(([sizeKey, qty]) => (
                    <div key={sizeKey} className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveSizeKey(sizeKey)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Hapus ukuran ini"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="block text-center text-xs font-bold text-slate-300 mb-1.5 font-mono">
                        Size {sizeKey}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleSizeQtyChange(sizeKey, parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-medium">Akumulasi Target Kuantitas Produksi:</span>
                  <span className="text-sm font-black text-indigo-400 font-mono">
                    {totalCalculatedQty.toLocaleString('id-ID')} PCS
                  </span>
                </div>
              </div>
            )}

            {/* TAB 4: BOM AKSESORIS */}
            {activeTab === 'BOM' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                      <Layers className="w-4 h-4" />
                      Bill of Materials (BOM Trims & Aksesoris)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Standar kebutuhan trims per 1 pcs garmen untuk alokasi otomatis di gudang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBomItem}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Aksesoris
                  </button>
                </div>

                <div className="space-y-2.5">
                  {bomList.map((bom, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Nama Aksesoris (misal: Kancing Jeans 24L, Resleting YKK, Hangtag)"
                          value={bom.item}
                          onChange={(e) => handleBomChange(idx, "item", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="Qty"
                          value={bom.qty_per_pcs}
                          onChange={(e) => handleBomChange(idx, "qty_per_pcs", parseFloat(e.target.value) || 1)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <span className="text-slate-400 text-xs font-medium shrink-0">pcs/baju</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBomItem(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SPESIFIKASI TEKNIS & CATATAN */}
            {activeTab === 'SPECS' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    Spesifikasi Kain & Instruksi Khusus Pengerjaan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Jenis & Spesifikasi Bahan Kain Utama
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Denim 13.5 Oz Non-Stretch / Katun Poplin 40s"
                        value={formData.fabric_type}
                        onChange={(e) => setFormData({ ...formData, fabric_type: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Toleransi Susut Kain Pola (Shrinkage Allowance %)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="20"
                          value={formData.target_shrinkage_pct}
                          onChange={(e) => setFormData({ ...formData, target_shrinkage_pct: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                        <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Catatan Khusus Produksi (Special Sewing & Finishing SOP)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Contoh: Gunakan benang jahit warna emas 20/2, pasang rivet di sudut saku depan, cuci bio-bleach ringan pada tahap washing, hangtag dipasang di saku belakang kanan."
                      value={formData.special_instructions}
                      onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* MODAL FOOTER */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/90 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs hidden sm:inline">Total Target:</span>
              <span className="text-white font-mono font-bold text-xs bg-slate-800 px-2.5 py-1 rounded-lg">
                {totalCalculatedQty} Pcs
              </span>
              <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                Rp {financialSummary.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan SO' : 'Daftarkan Sales Order'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>

      {/* POPUP MODAL TAMBAH BUYER / BRAND BARU */}
      {showNewBuyerModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-indigo-500/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Registrasi Brand / Buyer Baru
              </h3>
              <button
                onClick={() => setShowNewBuyerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Brand / Perusahaan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: ERIGO / DELUSI / ZARA"
                  value={newBuyerName}
                  onChange={(e) => setNewBuyerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white uppercase font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  No. Telepon / WhatsApp PIC
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={newBuyerPhone}
                  onChange={(e) => setNewBuyerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Alamat Kantor / Gudang Buyer
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap tujuan pengiriman"
                  value={newBuyerAddress}
                  onChange={(e) => setNewBuyerAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewBuyerModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={creatingBuyer}
                onClick={handleCreateNewBuyer}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{creatingBuyer ? 'Mendaftarkan...' : 'Simpan Brand'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
