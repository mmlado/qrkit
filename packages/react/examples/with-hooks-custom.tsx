/**
 * Example: low-level hooks (bring your own scanner / renderer)
 *
 * useURDecoder accepts raw strings from any QR source.
 * useQRParts gives you the current part string to pass to any renderer.
 *
 * Replace MyScanner and renderQR with any library of your choice.
 */

import React, { useCallback, useState } from "react";

import { buildEthSignRequestURParts, parseConnection } from "@qrkit/core";
import type { Account, ScannedUR } from "@qrkit/core";
import { useQRParts, useURDecoder } from "@qrkit/react";

// Swap these out for your own scanner and renderer
declare function renderQR(data: string): string; // returns a data URL
declare function MyScanner(props: { onResult: (data: string) => void }): React.ReactElement;

export function App() {
  const [account, setAccount] = useState<Account | null>(null);

  // useURDecoder handles multi-frame UR assembly — feed it from any scanner
  const { receivePart, progress } = useURDecoder({
    onScan: useCallback((data: ScannedUR | string) => {
      try {
        const accounts = parseConnection(data as ScannedUR, { chains: ["evm"] });
        const acc = accounts[0];
        if (!acc) return false;
        setAccount(acc);
      } catch {
        return false;
      }
    }, []),
  });

  const signParts =
    account?.chain === "evm"
      ? buildEthSignRequestURParts({ signData: "Hello", address: account.address, sourceFingerprint: account.sourceFingerprint, origin: "My dApp" })
      : [];

  // useQRParts cycles through parts — feed the current string to any renderer
  const { part, frame, total } = useQRParts({ parts: signParts });

  return (
    <div>
      {/* Your own scanner feeds raw strings into receivePart */}
      <MyScanner onResult={receivePart} />
      {progress !== null && <p>{progress}% assembled</p>}

      {/* Your own renderer consumes the current part string */}
      {part && <img src={renderQR(part)} alt={`QR frame ${frame + 1} of ${total}`} />}
    </div>
  );
}
