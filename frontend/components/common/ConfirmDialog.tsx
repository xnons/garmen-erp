"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Pengganti window.confirm() / window.prompt() yang seragam & tidak nge-block.
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: "Hapus SO?", message: "...", tone: "danger" });
 *
 *   const prompt = usePrompt();
 *   const size = await prompt({ title: "Ukuran baru", placeholder: "mis. XXL" });
 *   if (size == null) return; // dibatalkan
 */

export interface ConfirmOptions {
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "default";
}

export interface PromptOptions extends ConfirmOptions {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  /** Kembalikan string error untuk menahan submit, atau null jika valid. */
  validate?: (value: string) => string | null;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;
type PromptFn = (opts: PromptOptions) => Promise<string | null>;

interface DialogApi {
  confirm: ConfirmFn;
  prompt: PromptFn;
}

const DialogContext = createContext<DialogApi | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useConfirm harus dipakai di dalam <ConfirmProvider>");
  return ctx.confirm;
}

export function usePrompt(): PromptFn {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("usePrompt harus dipakai di dalam <ConfirmProvider>");
  return ctx.prompt;
}

type State =
  | { kind: "confirm"; opts: ConfirmOptions }
  | { kind: "prompt"; opts: PromptOptions };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const resolver = useRef<(v: boolean | string | null) => void>(() => {});

  const confirm = useCallback<ConfirmFn>((opts) => {
    setState({ kind: "confirm", opts });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve as (v: boolean | string | null) => void;
    });
  }, []);

  const prompt = useCallback<PromptFn>((opts) => {
    setState({ kind: "prompt", opts });
    setValue(opts.defaultValue ?? "");
    setError(null);
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve as (v: boolean | string | null) => void;
    });
  }, []);

  const settle = useCallback((result: boolean | string | null) => {
    resolver.current(result);
    setState(null);
    setValue("");
    setError(null);
  }, []);

  const submitPrompt = useCallback(() => {
    if (state?.kind !== "prompt") return;
    const v = value.trim();
    const err = state.opts.validate?.(v) ?? (v ? null : "Wajib diisi.");
    if (err) {
      setError(err);
      return;
    }
    settle(v);
  }, [state, value, settle]);

  if (!state) return <DialogContext.Provider value={{ confirm, prompt }}>{children}</DialogContext.Provider>;

  const { opts } = state;
  const danger = opts.tone === "danger";
  const isPrompt = state.kind === "prompt";

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => settle(isPrompt ? null : false)}
      >
        <div
          className="glass-panel animate-modal-pop w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
        >
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border ${
                danger
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white">{opts.title || "Konfirmasi"}</h3>
              {opts.message && (
                <div className="mt-1.5 text-sm text-slate-400 leading-relaxed">{opts.message}</div>
              )}
            </div>
            <button
              onClick={() => settle(isPrompt ? null : false)}
              className="shrink-0 text-slate-500 hover:text-slate-300"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isPrompt && (
            <div className="mt-4">
              {(state.opts as PromptOptions).label && (
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {(state.opts as PromptOptions).label}
                </label>
              )}
              <input
                autoFocus
                value={value}
                placeholder={(state.opts as PromptOptions).placeholder}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitPrompt();
                  if (e.key === "Escape") settle(null);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2.5">
            <button
              onClick={() => settle(isPrompt ? null : false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              {opts.cancelText || "Batal"}
            </button>
            <button
              autoFocus={!isPrompt}
              onClick={() => (isPrompt ? submitPrompt() : settle(true))}
              className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${
                danger ? "bg-rose-600 hover:bg-rose-500" : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              {opts.confirmText || (isPrompt ? "Simpan" : "Ya, Lanjutkan")}
            </button>
          </div>
        </div>
      </div>
    </DialogContext.Provider>
  );
}

export default ConfirmProvider;
