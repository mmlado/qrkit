/**
 * Example: low-level hooks (batteries-included)
 *
 * useQRScanner drives qr-scanner internally.
 * useQRDisplay renders to a canvas via qrcode.
 */

import { useCallback, useState } from "react";

import { buildEthSignRequestURParts, parseConnection, parseEthSignature } from "@qrkit/core";
import type { Account, ScannedUR } from "@qrkit/core";
import { useQRDisplay, useQRScanner } from "@qrkit/react";
import "@qrkit/react/styles.css";

type Screen = "connect" | "sign-display" | "sign-scan" | "done";

export function App() {
  const [screen, setScreen] = useState<Screen>("connect");
  const [account, setAccount] = useState<Account | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const message = "Hello from My dApp";

  const handleConnectionScan = useCallback((data: ScannedUR | string): boolean | void => {
    try {
      const accounts = parseConnection(data as ScannedUR, { chains: ["evm"] });
      const acc = accounts[0];
      if (!acc) return false;
      setAccount(acc);
      setScreen("sign-display");
    } catch {
      return false;
    }
  }, []);

  const { videoRef: connectVideoRef, progress: connectProgress, error: connectError } =
    useQRScanner({ onScan: handleConnectionScan, enabled: screen === "connect" });

  const signParts =
    account?.chain === "evm"
      ? buildEthSignRequestURParts({ signData: message, address: account.address, sourceFingerprint: account.sourceFingerprint, origin: "My dApp" })
      : [];

  const { canvasRef: signCanvasRef, frame, total } = useQRDisplay({ parts: signParts });

  const handleSignatureScan = useCallback((data: ScannedUR | string): boolean | void => {
    try {
      const sig = parseEthSignature(data as ScannedUR);
      setSignature(sig);
      setScreen("done");
    } catch {
      return false;
    }
  }, []);

  const { videoRef: signVideoRef, progress: signProgress, error: signError } = useQRScanner({
    onScan: handleSignatureScan,
    enabled: screen === "sign-scan",
  });

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      {screen === "connect" && (
        <>
          <h2>Connect wallet</h2>
          {connectError && <p style={{ color: "red" }}>{connectError}</p>}
          <video ref={connectVideoRef} autoPlay playsInline muted style={{ width: "100%" }} />
          {connectProgress !== null && <p>{connectProgress}% scanned</p>}
        </>
      )}
      {screen === "sign-display" && (
        <>
          <h2>Scan with your wallet</h2>
          <canvas ref={signCanvasRef} style={{ width: "100%" }} />
          <p>{frame + 1} / {total}</p>
          <button onClick={() => setScreen("sign-scan")}>Wallet signed — scan response</button>
        </>
      )}
      {screen === "sign-scan" && (
        <>
          <h2>Scan signature</h2>
          {signError && <p style={{ color: "red" }}>{signError}</p>}
          <video ref={signVideoRef} autoPlay playsInline muted style={{ width: "100%" }} />
          {signProgress !== null && <p>{signProgress}% scanned</p>}
          <button onClick={() => setScreen("sign-display")}>← Back</button>
        </>
      )}
      {screen === "done" && (
        <>
          <h2>Done</h2>
          <p>Address: {account?.address}</p>
          <p>Signature: {signature}</p>
        </>
      )}
    </div>
  );
}
