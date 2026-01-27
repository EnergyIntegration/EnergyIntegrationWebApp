import type { ReactNode } from "react";

type PanelProps = {
  className?: string;
  padded?: boolean;
  children: ReactNode;
};

export function Panel({ className = "", padded = true, children }: PanelProps) {
  const padding = padded ? "p-3" : "";
  return (
    <div className={`border rounded ${padding} ${className}`}>
      {children}
    </div>
  );
}
