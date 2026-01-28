import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import type { OptimizationConfigUI } from "../../types/stream";
import { CollapsiblePanel } from "../ui/CollapsiblePanel";
import { Panel } from "../ui/Panel";

type SolveStepProps = {
  henReady: boolean;
  onSolve: () => void;
  buttonTone: string;
  panelTone: string;
  fieldTone: string;
  optOpen: boolean;
  setOptOpen: Dispatch<SetStateAction<boolean>>;
  optConfig: OptimizationConfigUI;
  setOptConfig: Dispatch<SetStateAction<OptimizationConfigUI>>;
  consoleConnected: boolean;
  consoleLines: string[];
  consoleBoxRef: RefObject<HTMLDivElement | null>;
};

export function SolveStep({
  henReady,
  onSolve,
  buttonTone,
  panelTone,
  fieldTone,
  optOpen,
  setOptOpen,
  optConfig,
  setOptConfig,
  consoleConnected,
  consoleLines,
  consoleBoxRef,
}: SolveStepProps) {
  const inputClass = `control-h w-full border rounded px-2 ${fieldTone}`;
  const wideField = "w-[360px] max-w-full";
  const boolHint = "e.g. 1,0,1 or true,false,true";
  const setRoot = (key: keyof OptimizationConfigUI, value: string | boolean) =>
    setOptConfig((p) => ({ ...p, [key]: value }));
  const setGroup = (group: "lmtd" | "pwl" | "scaling" | "cost", key: string, value: string) =>
    setOptConfig((p) => ({ ...p, [group]: { ...(p as any)[group], [key]: value } }));
  const field = (label: string, node: ReactNode, width = "w-[180px]") => (
    <div className={width}>
      <div className="text-sm mb-1">{label}</div>
      {node}
    </div>
  );
  const textField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    opts: { width?: string; type?: string; placeholder?: string; disabled?: boolean } = {}
  ) =>
    field(
      label,
      <input
        className={`${inputClass} ${opts.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        type={opts.type ?? "text"}
        value={value}
        disabled={opts.disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
      />,
      opts.width
    );
  const selectField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[],
    opts: { width?: string; disabled?: boolean } = {}
  ) =>
    field(
      label,
      <select
        className={`${inputClass} ${opts.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        value={value}
        disabled={opts.disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>,
      opts.width
    );
  const checkField = (
    label: string,
    checked: boolean,
    onChange: (value: boolean) => void,
    width = "w-[180px]"
  ) => (
    <div className={`${width} flex items-center gap-2 pt-6`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="text-sm">{label}</div>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-xl font-bold">Solve (MILP)</div>
        <button
          className={`px-3 py-1.5 border rounded transition-colors ml-auto ${buttonTone} tone-button-primary ${henReady ? "" : "opacity-50 cursor-not-allowed"}`}
          onClick={onSolve}
          title="Solve"
          disabled={!henReady}
        >
          Solve
        </button>
      </div>

      <CollapsiblePanel
        title={<span className="ui-title">Optimization settings</span>}
        open={optOpen}
        onToggle={() => setOptOpen((v) => !v)}
        className={panelTone}
        contentClassName="p-3 space-y-4"
      >
        <div>
          <div className="font-semibold mb-2">Model</div>
          <div className="flex flex-wrap gap-3">
            {selectField("model_kind", optConfig.model_kind, (v) => setRoot("model_kind", v), ["linear", "nonlinear"])}
            {checkField("warm_start", optConfig.warm_start, (v) => setRoot("warm_start", v))}
            {checkField("ratio_constraint", optConfig.ratio_constraint, (v) => setRoot("ratio_constraint", v))}
            {textField("mvr_atleast", optConfig.mvr_atleast, (v) => setRoot("mvr_atleast", v), { type: "number" })}
            {textField("mvr_select (optional; comma/space separated bools)", optConfig.mvr_select_text, (v) => setRoot("mvr_select_text", v), { width: wideField, placeholder: boolHint })}
            {textField("mhp_atleast", optConfig.mhp_atleast, (v) => setRoot("mhp_atleast", v), { type: "number" })}
            {textField("mhp_select (optional; comma/space separated bools)", optConfig.mhp_select_text, (v) => setRoot("mhp_select_text", v), { width: wideField, placeholder: boolHint })}
            {textField("rc_atleast", optConfig.rc_atleast, (v) => setRoot("rc_atleast", v), { type: "number" })}
            {textField("rc_select (optional; comma/space separated bools)", optConfig.rc_select_text, (v) => setRoot("rc_select_text", v), { width: wideField, placeholder: boolHint })}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">LMTD <span className="text-xs font-normal text-gray-500 dark:text-neutral-400">(unused)</span></div>
          <div className="flex flex-wrap gap-3">
            {selectField("method", optConfig.lmtd.method, (v) => setGroup("lmtd", "method", v),
              ["accurate", "harmonic_approx", "log_shifted", "log_smooth_eps",], { disabled: true })}
            {textField("ε (K)", optConfig.lmtd.eps, (v) => setGroup("lmtd", "eps", v), { disabled: true })}
            {textField("minΔT (K)", optConfig.lmtd.minDeltaT, (v) => setGroup("lmtd", "minDeltaT", v), { disabled: true })}
            {textField("maxΔT (K)", optConfig.lmtd.maxDeltaT, (v) => setGroup("lmtd", "maxDeltaT", v), { disabled: true })}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">PWL <span className="text-xs font-normal text-gray-500 dark:text-neutral-400">(unused)</span></div>
          <div className="flex flex-wrap gap-3">
            {selectField("method", optConfig.pwl.method, (v) => setGroup("pwl", "method", v),
              ["none", "lin", "log", "log_smooth",], { disabled: true })}
            {textField("nsegs", optConfig.pwl.nsegs, (v) => setGroup("pwl", "nsegs", v), { disabled: true })}
            {textField("min_area", optConfig.pwl.min_area, (v) => setGroup("pwl", "min_area", v), { disabled: true })}
            {textField("max_area", optConfig.pwl.max_area, (v) => setGroup("pwl", "max_area", v), { disabled: true })}
            {textField("include_zero", optConfig.pwl.include_zero, (v) => setGroup("pwl", "include_zero", v), { disabled: true })}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">Scaling <span className="text-xs font-normal text-gray-500 dark:text-neutral-400">(unused)</span></div>
          <div className="flex flex-wrap gap-3">
            {textField("Q", optConfig.scaling.Q, (v) => setGroup("scaling", "Q", v), { disabled: true })}
            {textField("A", optConfig.scaling.A, (v) => setGroup("scaling", "A", v), { disabled: true })}
            {textField("ΔT", optConfig.scaling.DeltaT, (v) => setGroup("scaling", "DeltaT", v), { disabled: true })}
            {textField("LMTD", optConfig.scaling.LMTD, (v) => setGroup("scaling", "LMTD", v), { disabled: true })}
            {textField("cost", optConfig.scaling.cost, (v) => setGroup("scaling", "cost", v), { disabled: true })}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">Cost</div>
          <div className="flex flex-wrap gap-3">
            {textField("HE_cost_intercept", optConfig.cost.HE_cost_intercept, (v) => setGroup("cost", "HE_cost_intercept", v))}
            {textField("HE_cost_slope", optConfig.cost.HE_cost_slope, (v) => setGroup("cost", "HE_cost_slope", v))}
            {textField("HE_cost_exponent", optConfig.cost.HE_cost_exponent, (v) => setGroup("cost", "HE_cost_exponent", v))}
            {textField("comp_cost_intercept", optConfig.cost.comp_cost_intercept, (v) => setGroup("cost", "comp_cost_intercept", v))}
            {textField("comp_cost_slope", optConfig.cost.comp_cost_slope, (v) => setGroup("cost", "comp_cost_slope", v))}
            {textField("comp_cost_exponent", optConfig.cost.comp_cost_exponent, (v) => setGroup("cost", "comp_cost_exponent", v))}
            {textField("electricity_price", optConfig.cost.electricity_price, (v) => setGroup("cost", "electricity_price", v))}
            {textField("annualization_factor", optConfig.cost.annualization_factor, (v) => setGroup("cost", "annualization_factor", v))}
            {textField("annual_operating_time (s)", optConfig.cost.annual_operating_time, (v) => setGroup("cost", "annual_operating_time", v))}
            {selectField("area_form", optConfig.cost.area_form, (v) => setGroup("cost", "area_form", v), ["original", "ε_shifted"])}
          </div>
        </div>
      </CollapsiblePanel>

      <Panel className="tone-panel-red">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-semibold ui-title">Console</div>
          <div className={consoleConnected ? "text-xs text-emerald-600" : "text-xs text-gray-500 dark:text-neutral-400"}>
            {consoleConnected ? "connected" : "disconnected"}
          </div>
        </div>
        <div
          ref={consoleBoxRef}
          className="console-box rounded border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/60"
        >
          <pre className="text-xs p-2 whitespace-pre-wrap font-mono">
            {consoleLines.length ? consoleLines.join("\n") : "No logs yet."}
          </pre>
        </div>
      </Panel>
    </div>
  );
}
