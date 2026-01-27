import type { ScalarSpecUI } from "../types/stream";
import type { Theme } from "../types/theme";
import { toggleMode } from "../lib/scalarSpec";

export function ScalarSpecInline(props: {
  spec: ScalarSpecUI;
  unitOptions: string[];
  onChange: (next: ScalarSpecUI) => void;
  theme: Theme;
  disabled?: boolean;
  lockMode?: boolean;
  showModeToggle?: boolean;
  enabledToneClassName?: string;
  disabledToneClassName?: string;
  keepSpin?: boolean;
  unitWidthClassName?: string;
  stopPropagation?: boolean;
}) {
  const {
    spec,
    unitOptions,
    onChange,
    disabled = false,
    lockMode = false,
    showModeToggle = true,
    enabledToneClassName = "",
    disabledToneClassName = "bg-gray-100 text-gray-500 border-gray-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800",
    keepSpin = false,
    unitWidthClassName = "w-[75px]",
    stopPropagation = false,
  } = props;

  const spinClass = keepSpin ? "" : "no-spin";
  const fieldTone = disabled ? disabledToneClassName : enabledToneClassName;
  const fieldDisabledClass = disabled ? "cursor-not-allowed opacity-80" : "";

  const icon = spec.mode === "fixed" ? "≡" : "↔";
  const modeTitle = disabled
    ? spec.mode === "fixed" ? "Fixed" : "Range"
    : lockMode
      ? `${spec.mode === "fixed" ? "Fixed" : "Range"} (locked)`
      : `${spec.mode === "fixed" ? "Fixed" : "Range"} (click to change)`;

  const gridCols = spec.mode === "fixed"
    ? (showModeToggle ? "grid-cols-[24px_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]")
    : (showModeToggle ? "grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]");

  function stop(e: { stopPropagation: () => void }) {
    if (stopPropagation) e.stopPropagation();
  }

  return (
    <div className={`grid ${gridCols} gap-2 items-center`}>
      {showModeToggle ? (
        <button
          type="button"
          className={`control-h w-6 border rounded border-neutral-200 hover:bg-gray-100 dark:border-neutral-800 dark:hover:bg-neutral-900 ${disabled || lockMode ? "opacity-60 cursor-not-allowed" : ""}`}
          title={modeTitle}
          aria-label={modeTitle}
          disabled={disabled || lockMode}
          onClick={(e) => {
            stop(e);
            onChange(toggleMode(spec));
          }}
        >
          {icon}
        </button>
      ) : null}

      {spec.mode === "fixed" ? (
        <input
          className={`${spinClass} control-h w-full border rounded px-2 py-1 ${fieldTone} ${fieldDisabledClass}`}
          type="number"
          value={spec.value}
          disabled={disabled}
          onClick={stop}
          onChange={(e) => onChange({ ...spec, value: e.target.value })}
          placeholder="value"
        />
      ) : (
        <>
          <input
            className={`${spinClass} control-h w-full border rounded px-2 py-1 ${fieldTone} ${fieldDisabledClass}`}
            type="number"
            value={spec.lo}
            disabled={disabled}
            onClick={stop}
            onChange={(e) => onChange({ ...spec, lo: e.target.value })}
            placeholder="lo"
          />
          <input
            className={`${spinClass} control-h w-full border rounded px-2 py-1 ${fieldTone} ${fieldDisabledClass}`}
            type="number"
            value={spec.hi}
            disabled={disabled}
            onClick={stop}
            onChange={(e) => onChange({ ...spec, hi: e.target.value })}
            placeholder="hi"
          />
        </>
      )}

      <select
        className={`control-h ${unitWidthClassName} border rounded pl-1 pr-0.8 py-1 ${fieldTone} ${fieldDisabledClass}`}
        value={spec.unit}
        disabled={disabled}
        onClick={stop}
        onChange={(e) => onChange({ ...spec, unit: e.target.value })}
      >
        {unitOptions.map((u) => (
          <option value={u} key={u}>{u}</option>
        ))}
      </select>
    </div>
  );
}

