import type { Dispatch, ReactNode, SetStateAction } from "react";
import { StreamTable, type ColumnVisibility } from "../StreamTable";
import { EXTRA_COLUMN_DEFS } from "../../lib/columns";
import type { Issue } from "../../lib/validation";
import type { IntervalsConfigUI, StreamRowUI } from "../../types/stream";
import type { Theme } from "../../types/theme";
import { CollapsiblePanel } from "../ui/CollapsiblePanel";
import { Panel } from "../ui/Panel";

type StreamsStepProps = {
  streams: StreamRowUI[];
  issues: Issue[];
  hasError: boolean;
  visibleColumns: ColumnVisibility;
  setVisibleColumns: Dispatch<SetStateAction<ColumnVisibility>>;
  intervalsOpen: boolean;
  setIntervalsOpen: Dispatch<SetStateAction<boolean>>;
  intervalsConfig: IntervalsConfigUI;
  setIntervalsConfig: Dispatch<SetStateAction<IntervalsConfigUI>>;
  onResetIntervals: () => void;
  onAddStream: (thermal: "hot" | "cold") => void;
  onBuildHEN: () => void;
  onUpdateStream: (id: string, next: StreamRowUI) => void;
  onDeleteStream: (id: string) => void;
  onDuplicateStream: (id: string) => void;
  theme: Theme;
  buttonTone: string;
  panelTone: string;
  fieldTone: string;
};

export function StreamsStep({
  streams,
  issues,
  hasError,
  visibleColumns,
  setVisibleColumns,
  intervalsOpen,
  setIntervalsOpen,
  intervalsConfig,
  setIntervalsConfig,
  onResetIntervals,
  onAddStream,
  onBuildHEN,
  onUpdateStream,
  onDeleteStream,
  onDuplicateStream,
  theme,
  buttonTone,
  panelTone,
  fieldTone,
}: StreamsStepProps) {
  const intervalsSummary = `Intervals: ${intervalsConfig.T_interval_method === "default" ? "auto" : intervalsConfig.T_interval_method} / ` +
    `maxΔT: ${(intervalsConfig.T_interval_method === "limit_span" || intervalsConfig.T_interval_method === "both")
      ? (intervalsConfig.maxDeltaT.trim() ? `${intervalsConfig.maxDeltaT.trim()} K` : "unset")
      : "auto"} / ` +
    `Nodes: ${intervalsConfig.node_rule === "inout" ? "auto" : intervalsConfig.node_rule}`;
  const inputClass = `control-h w-full border rounded px-2 ${fieldTone}`;
  const field = (label: string, node: ReactNode, width = "w-[180px]") => (
    <div className={width}>
      <div className="text-sm mb-1">{label}</div>
      {node}
    </div>
  );
  const optionNodes = (options: Array<string | [string, string]>) =>
    options.map((opt) => {
      const [value, label] = Array.isArray(opt) ? opt : [opt, opt];
      return (
        <option key={value} value={value}>
          {label}
        </option>
      );
    });
  const textField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    opts: { width?: string; type?: string; placeholder?: string } = {}
  ) =>
    field(
      label,
      <input
        className={inputClass}
        type={opts.type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={opts.placeholder}
      />,
      opts.width
    );
  const selectField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: Array<string | [string, string]>,
    width = "w-[180px]"
  ) =>
    field(
      label,
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {optionNodes(options)}
      </select>,
      width
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
  const setRoot = (key: keyof IntervalsConfigUI, value: string | boolean) =>
    setIntervalsConfig((p) => ({ ...p, [key]: value }));
  const setMvr = (key: keyof IntervalsConfigUI["mvr_config"], value: string) =>
    setIntervalsConfig((p) => ({ ...p, mvr_config: { ...p.mvr_config, [key]: value } }));
  const addForbidden = () =>
    setIntervalsConfig((p) => ({
      ...p,
      forbidden_match: [...p.forbidden_match, {
        id: crypto.randomUUID(),
        hot: "",
        cold: "",
        Q_lb: "0",
        Q_ub: "0",
      }],
    }));
  const updateForbidden = (id: string, patch: Partial<IntervalsConfigUI["forbidden_match"][number]>) =>
    setIntervalsConfig((p) => ({
      ...p,
      forbidden_match: p.forbidden_match.map((x) => x.id === id ? { ...x, ...patch } : x),
    }));
  const removeForbidden = (id: string) =>
    setIntervalsConfig((p) => ({
      ...p,
      forbidden_match: p.forbidden_match.filter((x) => x.id !== id),
    }));
  const nodesCustom = intervalsConfig.node_rule === "custom";
  const nodesClass = `w-full border rounded text-sm ${fieldTone} ${nodesCustom
    ? "control-h px-2 py-1"
    : "control-h px-2 py-1 opacity-60 cursor-not-allowed bg-gray-50 dark:bg-neutral-900/40"
  }`;
  const miniInputClass = `control-h border rounded px-2 ${fieldTone}`;
  const fmInput = (
    value: string,
    onChange: (value: string) => void,
    width: string,
    opts: { type?: string; placeholder?: string } = {}
  ) => (
    <input
      className={`${miniInputClass} ${width}`}
      type={opts.type ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={opts.placeholder}
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xl font-bold mr-4">Streams</div>

        <button className={`px-3 py-1.5 border rounded transition-colors ${buttonTone}`} onClick={() => onAddStream("hot")}>
          + Hot
        </button>
        <button className={`px-3 py-1.5 border rounded transition-colors ${buttonTone}`} onClick={() => onAddStream("cold")}>
          + Cold
        </button>

        <button
          className={`px-3 py-1.5 border rounded transition-colors ml-auto ${buttonTone} tone-button-primary ${hasError ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={onBuildHEN}
          disabled={hasError}
          title={hasError ? "Fix errors before building." : "Build HEN"}
        >
          Build HEN
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="font-semibold">Extra columns</div>
        {EXTRA_COLUMN_DEFS.map((c) => (
          <label key={c.key} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={visibleColumns[c.key]}
              onChange={(e) => setVisibleColumns((prev) => ({ ...prev, [c.key]: e.target.checked }))}
            />
            {c.label}
          </label>
        ))}
      </div>

      <StreamTable
        streams={streams}
        onUpdate={onUpdateStream}
        onDelete={onDeleteStream}
        onDuplicate={onDuplicateStream}
        theme={theme}
        visibleColumns={visibleColumns}
      />

      <CollapsiblePanel
        title="Advanced (IntervalConfig)"
        open={intervalsOpen}
        onToggle={() => setIntervalsOpen((v) => !v)}
        className={panelTone}
        contentClassName="p-3 space-y-4"
        summary={!intervalsOpen ? (
          <div className="min-w-0 truncate text-gray-600 text-sm dark:text-neutral-400">
            {intervalsSummary}
          </div>
        ) : null}
      >
        <div>
          <div className="font-semibold mb-2">Grid</div>
          <div className="flex flex-wrap gap-3">
            {selectField("node_rule", intervalsConfig.node_rule, (v) => setRoot("node_rule", v), [
              ["inlet", "inlet (Tin)"],
              ["inout", "inout (Tin & Tout)"],
              ["custom", "custom"],
            ])}
            {selectField("T_interval_method", intervalsConfig.T_interval_method, (v) => setRoot("T_interval_method", v), [
              ["default", "default (from_streams)"],
              ["limit_span", "limit_span (maxΔT)"],
              ["cap_count", "cap_count (maxnumT)"],
              ["both", "both"],
            ])}
            {textField("maxΔT (K)", intervalsConfig.maxDeltaT, (v) => setRoot("maxDeltaT", v), { type: "number", placeholder: "e.g. 10" })}
            {textField("maxnumT", intervalsConfig.maxnumT, (v) => setRoot("maxnumT", v), { type: "number", placeholder: "e.g. 50" })}
            {field("T_nodes_specified (K, descending; comma/space/newline separated)", (
              <textarea
                className={nodesClass}
                rows={1}
                value={intervalsConfig.T_nodes_specified_text}
                onChange={(e) => setRoot("T_nodes_specified_text", e.target.value)}
                placeholder="e.g. 450, 400, 350"
                disabled={!nodesCustom}
              />
            ), "w-[580px] max-w-full")}
            {checkField("use_clapeyron", intervalsConfig.use_clapeyron, (v) => setRoot("use_clapeyron", v))}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">MVR</div>
          <div className="flex flex-wrap gap-3">
            {selectField("method", intervalsConfig.mvr_config.method, (v) => setMvr("method", v), ["piecewise", "gdp"])}
            {textField("mode", intervalsConfig.mvr_config.mode, (v) => setMvr("mode", v), { placeholder: "polytropic" })}
            {textField("step_ratio", intervalsConfig.mvr_config.step_ratio, (v) => setMvr("step_ratio", v))}
            {textField("isentropic_efficiency", intervalsConfig.mvr_config.isentropic_efficiency, (v) => setMvr("isentropic_efficiency", v))}
            {textField("polytropic_efficiency", intervalsConfig.mvr_config.polytropic_efficiency, (v) => setMvr("polytropic_efficiency", v))}
            {textField("mechanical_efficiency", intervalsConfig.mvr_config.mechanical_efficiency, (v) => setMvr("mechanical_efficiency", v))}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-2">Forbidden match</div>
          <div className="text-xs text-gray-500 dark:text-neutral-400 mb-2">
            Q_lb/Q_ub can be used to forbid matches or enforce min/max exchange. Leave all empty to ignore.
          </div>

          <div className="flex items-center gap-2 mb-2">
            <button
              className={`px-2 py-1 border rounded ${buttonTone}`}
              type="button"
              onClick={addForbidden}
              title="Add forbidden match"
            >
              + Add
            </button>
          </div>

          {intervalsConfig.forbidden_match.length === 0 ? (
            <div className="text-gray-600 text-sm dark:text-neutral-400">None.</div>
          ) : (
            <div className="w-full overflow-auto">
              <table className="text-sm w-max border-collapse">
                <thead>
                  <tr className="text-gray-700 dark:text-neutral-300">
                    <th className="text-left pr-3 py-0.5 whitespace-nowrap">hot</th>
                    <th className="text-left pr-3 py-0.5 whitespace-nowrap">cold</th>
                    <th className="text-left pr-3 py-0.5 whitespace-nowrap">Q_lb (W)</th>
                    <th className="text-left pr-3 py-0.5 whitespace-nowrap">Q_ub (W)</th>
                    <th className="text-left pr-0 py-0.5 whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody>
                  {intervalsConfig.forbidden_match.map((r) => (
                    <tr key={r.id}>
                      <td className="pr-3 py-0.5">
                        {fmInput(r.hot, (v) => updateForbidden(r.id, { hot: v }), "w-24", { placeholder: "h1" })}
                      </td>
                      <td className="pr-3 py-0.5">
                        {fmInput(r.cold, (v) => updateForbidden(r.id, { cold: v }), "w-24", { placeholder: "c1" })}
                      </td>
                      <td className="pr-3 py-0.5">
                        {fmInput(r.Q_lb, (v) => updateForbidden(r.id, { Q_lb: v }), "w-32", { type: "number" })}
                      </td>
                      <td className="pr-3 py-0.5">
                        {fmInput(r.Q_ub, (v) => updateForbidden(r.id, { Q_ub: v }), "w-32", { type: "number" })}
                      </td>
                      <td className="pr-0 py-0.5">
                        <button
                          className={`px-2 py-1 border rounded ${buttonTone}`}
                          type="button"
                          onClick={() => removeForbidden(r.id)}
                          title="Delete row"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            className={`px-3 py-1.5 border rounded transition-colors ${buttonTone}`}
            type="button"
            onClick={onResetIntervals}
            title="Reset all interval settings"
          >
            Reset
          </button>
        </div>
      </CollapsiblePanel>

      <Panel className={`${panelTone} ${issues.length === 0 ? "tone-panel-green" : ""}`}>
        <div className="font-semibold mb-2">Validation</div>
        {issues.length === 0 ? (
          <div className="text-green-700 dark:text-green-400">No issues.</div>
        ) : (
          <div className="space-y-1">
            {issues.slice(0, 30).map((it, idx) => (
              <div
                key={idx}
                className={it.level === "error" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}
              >
                [{it.level}] {it.streamId === "__intervals__" ? "IntervalsConfig" : (streams.find((s) => s.id === it.streamId)?.name ?? it.streamId)}
                {it.field ? `.${it.field}` : ""}: {it.message}
              </div>
            ))}
            {issues.length > 30 ? (
              <div className="text-gray-500 dark:text-neutral-400">
                ... ({issues.length - 30} more)
              </div>
            ) : null}
          </div>
        )}
      </Panel>
    </div>
  );
}
