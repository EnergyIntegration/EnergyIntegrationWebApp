import type { ReactNode } from "react";
import type { ScalarSpecUI } from "../types/stream";
import type { Theme } from "../types/theme";

const unitOptions: Record<string, string[]> = {
  flow: ["mol/s", "kmol/h", "kmol/s"],
  temperature: ["°C", "K"],
  pressure: ["bar", "kPa", "MPa", "Pa"],
};

export function ScalarSpecEditor(props: {
  label: ReactNode;
  spec: ScalarSpecUI;
  unitKind: "flow" | "temperature" | "pressure";
  disabled?: boolean;
  theme: Theme;
  onChange: (next: ScalarSpecUI) => void;
}) {
  const { label, spec, unitKind, disabled, onChange } = props;
  const units = unitOptions[unitKind];
  const fieldTone = "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex items-center gap-2">
          <select
            className={`border rounded px-2 py-1 text-sm ${fieldTone}`}
            value={spec.mode}
            disabled={disabled}
            onChange={(e) => {
              const mode = e.target.value as ScalarSpecUI["mode"];
              onChange({ ...spec, mode });
            }}
          >
            <option value="fixed">fixed</option>
            <option value="range">range</option>
          </select>

          <select
            className={`border rounded px-2 py-1 text-sm ${fieldTone}`}
            value={spec.unit}
            disabled={disabled}
            onChange={(e) => onChange({ ...spec, unit: e.target.value })}
          >
            {units.map((u) => (
              <option value={u} key={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {spec.mode === "fixed" ? (
        <input
          className={`no-spin w-full border rounded px-2 py-1 ${fieldTone}`}
          type="number"
          value={spec.value}
          disabled={disabled}
          onChange={(e) => onChange({ ...spec, value: e.target.value })}
          placeholder="value"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <input
            className={`no-spin border rounded px-2 py-1 ${fieldTone}`}
            type="number"
            value={spec.lo}
            disabled={disabled}
            onChange={(e) => onChange({ ...spec, lo: e.target.value })}
            placeholder="lo"
          />
          <input
            className={`no-spin border rounded px-2 py-1 ${fieldTone}`}
            type="number"
            value={spec.hi}
            disabled={disabled}
            onChange={(e) => onChange({ ...spec, hi: e.target.value })}
            placeholder="hi"
          />
        </div>
      )}
    </div>
  );
}
