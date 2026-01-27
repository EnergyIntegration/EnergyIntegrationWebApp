import type { ReactNode } from "react";

type CollapsiblePanelProps = {
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  className?: string;
  contentClassName?: string;
  summary?: ReactNode;
  children: ReactNode;
};

export function CollapsiblePanel({
  title,
  open,
  onToggle,
  className = "",
  contentClassName = "p-3",
  summary,
  children,
}: CollapsiblePanelProps) {
  return (
    <div className={`border rounded ${className}`}>
      <button
        className="w-full flex items-center gap-2 h-10 px-3"
        onClick={onToggle}
        type="button"
      >
        <div className="font-semibold">{open ? "▾" : "▸"} {title}</div>
        {!open && summary ? summary : null}
      </button>
      {open ? (
        <div className={contentClassName}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
