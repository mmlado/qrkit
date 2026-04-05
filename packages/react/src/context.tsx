import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import type { Account } from "@qrkit/core";

import { ConnectModal } from "./components/ConnectModal.js";
import { SignModal } from "./components/SignModal.js";
import type {
  QRKitContextValue,
  QRKitProviderProps,
  QRKitTheme,
  SignRequest,
} from "./types.js";

const QRKitContext = createContext<QRKitContextValue | null>(null);

function buildThemeStyle(theme: QRKitTheme): string {
  const vars: Record<string, string | undefined> = {
    "--qrkit-accent": theme.accent,
    "--qrkit-bg": theme.background,
    "--qrkit-backdrop": theme.backdrop,
    "--qrkit-text": theme.text,
    "--qrkit-text-muted": theme.textMuted,
    "--qrkit-radius": theme.radius,
    "--qrkit-font": theme.fontFamily,
  };

  const declarations = Object.entries(vars)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  return declarations ? `.qrkit {\n${declarations}\n}` : "";
}

interface PendingSign {
  request: SignRequest;
  resolve: (sig: string) => void;
  reject: (err: Error) => void;
}

export function QRKitProvider({
  children,
  theme = {},
  appName = "qrkit",
}: QRKitProviderProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [pendingSign, setPendingSign] = useState<PendingSign | null>(null);
  const pendingSignRef = useRef<PendingSign | null>(null);

  const themeStyle = useMemo(() => buildThemeStyle(theme), [theme]);

  useEffect(() => {
    if (!themeStyle) return;
    const el = document.createElement("style");
    el.setAttribute("data-qrkit-theme", "");
    el.textContent = themeStyle;
    document.head.appendChild(el);
    return () => el.remove();
  }, [themeStyle]);

  const connect = useCallback(() => setConnectOpen(true), []);
  const disconnect = useCallback(() => setAccount(null), []);

  const handleConnect = useCallback((acc: Account) => {
    setAccount(acc);
    setConnectOpen(false);
  }, []);

  const sign = useCallback((request: SignRequest): Promise<string> => {
    return new Promise((resolve, reject) => {
      const pending: PendingSign = { request, resolve, reject };
      pendingSignRef.current = pending;
      setPendingSign(pending);
    });
  }, []);

  const handleSign = useCallback((sig: string) => {
    pendingSignRef.current?.resolve(sig);
    pendingSignRef.current = null;
    setPendingSign(null);
  }, []);

  const handleReject = useCallback(() => {
    pendingSignRef.current?.reject(new Error("User rejected the sign request"));
    pendingSignRef.current = null;
    setPendingSign(null);
  }, []);

  const value = useMemo<QRKitContextValue>(
    () => ({ account, connect, disconnect, sign }),
    [account, connect, disconnect, sign],
  );

  return (
    <QRKitContext.Provider value={value}>
      {children}
      {connectOpen &&
        createPortal(
          <ConnectModal
            onConnect={handleConnect}
            onClose={() => setConnectOpen(false)}
          />,
          document.body,
        )}
      {pendingSign &&
        createPortal(
          <SignModal
            request={pendingSign.request}
            appName={appName}
            onSign={handleSign}
            onReject={handleReject}
          />,
          document.body,
        )}
    </QRKitContext.Provider>
  );
}

export function useQRKit(): QRKitContextValue {
  const ctx = useContext(QRKitContext);
  if (!ctx) throw new Error("useQRKit must be used within a QRKitProvider");
  return ctx;
}
