"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "pending" | "success" | "error";

interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}

interface ToastContextValue {
  /** Show a toast. Pending toasts auto-dismiss faster than success/error. */
  toast: (msg: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const ICON: Record<ToastKind, string> = {
  pending: "◴",
  success: "✓",
  error: "!",
};

const TINT: Record<ToastKind, string> = {
  pending: "var(--accent)",
  success: "var(--up)",
  error: "var(--down)",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((msg: string, kind: ToastKind = "pending") => {
    const id = nextId.current++;
    setItems((ts) => [...ts, { id, msg, kind }]);
    const ttl = kind === "pending" ? 2600 : 3400;
    setTimeout(() => setItems((ts) => ts.filter((t) => t.id !== id)), ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className="toast reveal" role="status">
            <span
              className="toast-icon"
              style={{
                background: TINT[t.kind],
                animation: t.kind === "pending" ? "spin 1.1s linear infinite" : "none",
              }}
              aria-hidden="true"
            >
              {ICON[t.kind]}
            </span>
            <span className="toast-msg">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
