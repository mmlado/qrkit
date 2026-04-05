import { useQRDisplay } from "../hooks/useQRDisplay.js";

export interface QRDisplayProps {
  parts: string[];
  interval?: number;
  size?: number;
  className?: string;
}

export function QRDisplay({ parts, interval, size = 300, className }: QRDisplayProps) {
  const { canvasRef, frame, total } = useQRDisplay({ parts, interval, size });

  return (
    <div className={`qrkit-qr-wrap${className ? ` ${className}` : ""}`}>
      <canvas ref={canvasRef} className="qrkit-qr-canvas" width={size} height={size} />
      {total > 1 && (
        <p className="qrkit-hint">
          Frame {frame + 1} / {total} — keep Shell pointed at the screen
        </p>
      )}
    </div>
  );
}
