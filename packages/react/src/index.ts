// Context + provider
export { QRKitProvider, useQRKit } from "./context.js";

// Modals
export { ConnectModal } from "./components/ConnectModal.js";
export { SignModal } from "./components/SignModal.js";

// Primitive components
export { QRScanner } from "./components/QRScanner.js";
export { QRDisplay } from "./components/QRDisplay.js";

// Low-level hooks
export { useQRScanner } from "./hooks/useQRScanner.js";
export { useQRDisplay } from "./hooks/useQRDisplay.js";
export { useURDecoder } from "./hooks/useURDecoder.js";
export { useQRParts } from "./hooks/useQRParts.js";

// Types
export type {
  QRKitTheme,
  SignRequest,
  QRKitContextValue,
  QRKitProviderProps,
  SignResult,
  EvmSignRequest,
  BtcMessageSignRequest,
  BtcPsbtSignRequest,
} from "./types.js";
export type { QRScannerProps } from "./components/QRScanner.js";
export type { QRDisplayProps } from "./components/QRDisplay.js";
export type { ConnectModalProps } from "./components/ConnectModal.js";
export type { SignModalProps } from "./components/SignModal.js";
export type { UseQRScannerOptions, UseQRScannerResult } from "./hooks/useQRScanner.js";
export type { UseQRDisplayOptions, UseQRDisplayResult } from "./hooks/useQRDisplay.js";
export type { UseURDecoderOptions, UseURDecoderResult } from "./hooks/useURDecoder.js";
export type { UseQRPartsOptions, UseQRPartsResult } from "./hooks/useQRParts.js";
