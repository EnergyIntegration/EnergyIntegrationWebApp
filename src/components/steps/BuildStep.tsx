import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { PlotlyFigurePayload } from "../../types/plotly";
import type { BuildInspectPayload } from "../../types/results";
import type { Theme } from "../../types/theme";
import { PlotlyFigure } from "../PlotlyFigure";
import { AsyncActionButton } from "../ui/AsyncActionButton";
import { Panel } from "../ui/Panel";

type BuildStepProps = {
  hasError: boolean;
  onBuildHEN: () => void;
  isBuildingHEN: boolean;
  buttonTone: string;
  panelTone: string;
  henPlot: PlotlyFigurePayload | null;
  buildInspect: BuildInspectPayload | null;
  theme: Theme;
};

const isHeatColumn = (name: string) => name === "heat_cascade" || /^(H|C)\d+$/i.test(name);
const formatFull = (v: number) => (!Number.isFinite(v) ? "" : (v === 0 || Object.is(v, -0) ? "0" : String(v)));
const formatProblem = (v: number) => (!Number.isFinite(v) || v === 0 ? "" : v.toFixed(0));
const formatComposite = (v: number) => (!Number.isFinite(v) ? "" : v.toFixed(0));
const goldLeft = { r: 34, g: 28, b: 20 };
const goldRight = { r: 246, g: 205, b: 112 };
const goldTrackGradient = `linear-gradient(90deg, rgb(${goldLeft.r} ${goldLeft.g} ${goldLeft.b}) 0%, rgb(${goldRight.r} ${goldRight.g} ${goldRight.b}) 100%)`;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const goldAt = (leftPct: number) => {
  const t = clamp01(leftPct / 100);
  const r = Math.round(goldLeft.r + (goldRight.r - goldLeft.r) * t);
  const g = Math.round(goldLeft.g + (goldRight.g - goldLeft.g) * t);
  const b = Math.round(goldLeft.b + (goldRight.b - goldLeft.b) * t);
  return `rgb(${r} ${g} ${b})`;
};
const problemColumnLabel = (name: string) =>
  ({ heat_cascade: "Heat Cascade", T_upper: "T_up (K)", T_lower: "T_low (K)" } as Record<string, string>)[name] ?? name;
const problemColumnTitle = (name: string) =>
  ({ heat_cascade: "Heat Cascade", T_upper: "Upper Temperature", T_lower: "Lower Temperature" } as Record<string, string>)[name] ?? name;
const isProblemTempColumn = (name: string) => name === "T_upper" || name === "T_lower";
const compositeColumnLabel = (name: string) =>
  ({ hot: "Hot Composite", cold: "Cold Composite", feasible_hc: "Feasible Heat Cascade", T: "Temperature (K)" } as Record<string, string>)[name] ?? name;

function heatBgColor(theme: Theme, value: number, maxAbs: number): string | undefined {
  if (!Number.isFinite(value) || value === 0 || maxAbs <= 0) return undefined;
  const alpha = Math.min(0.42, 0.08 + 0.34 * (Math.abs(value) / maxAbs));
  if (theme === "dark") {
    return value > 0 ? `rgba(248,113,113,${alpha})` : `rgba(96,165,250,${alpha})`;
  }
  return value > 0 ? `rgba(239,68,68,${alpha})` : `rgba(59,130,246,${alpha})`;
}

export function BuildStep({
  hasError,
  onBuildHEN,
  isBuildingHEN,
  buttonTone,
  panelTone,
  henPlot,
  buildInspect,
  theme,
}: BuildStepProps) {
  const [copyHint, setCopyHint] = useState<string>("");
  const hintTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
  }, []);

  const problem = buildInspect?.problem_table ?? null;
  const composite = buildInspect?.composite_curve ?? null;
  const summary = buildInspect?.summary ?? null;
  const temperatureNodes = useMemo(() => {
    const values = summary?.t_nodes_K?.filter((v) => Number.isFinite(v)) ?? [];
    if (values.length === 0) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const marks = values.map((value) => {
      const left = min === max ? 50 : ((value - min) / (max - min)) * 100;
      return { value, left };
    });
    return { min, max, marks };
  }, [summary]);

  const heatCols = useMemo(() => {
    if (!problem) return [];
    return problem.columns.map((name, idx) => (isHeatColumn(name) ? idx : -1)).filter((idx) => idx >= 0);
  }, [problem]);

  const heatMaxAbs = useMemo(() => {
    if (!problem || heatCols.length === 0) return 0;
    let maxAbs = 0;
    for (const row of problem.rows) {
      for (const idx of heatCols) {
        const v = row[idx];
        if (Number.isFinite(v)) maxAbs = Math.max(maxAbs, Math.abs(v));
      }
    }
    return maxAbs;
  }, [problem, heatCols]);

  const hotIdx = composite ? composite.columns.findIndex((c) => c === "hot") : -1;
  const coldIdx = composite ? composite.columns.findIndex((c) => c === "cold") : -1;
  const feasibleHcIdx = composite ? composite.columns.findIndex((c) => c === "feasible_hc") : -1;
  const utilityTargets = useMemo(() => {
    if (!composite || feasibleHcIdx < 0 || composite.rows.length === 0) return null;
    const first = Number(composite.rows[0]?.[feasibleHcIdx]);
    const last = Number(composite.rows[composite.rows.length - 1]?.[feasibleHcIdx]);
    if (!Number.isFinite(first) && !Number.isFinite(last)) return null;
    return { hotMin: first, coldMin: last };
  }, [composite, feasibleHcIdx]);
  const hotUtilityTarget = utilityTargets?.hotMin ?? NaN;
  const coldUtilityTarget = utilityTargets?.coldMin ?? NaN;
  const temperatureNodesJson = JSON.stringify(summary?.t_nodes_K ?? []);

  const showCopyHint = (msg: string) => {
    setCopyHint(msg);
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setCopyHint(""), 1100);
  };

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showCopyHint("Copied full-precision value.");
    } catch {
      showCopyHint("Copy failed.");
    }
  };

  const onCopyCell = async (e: ReactMouseEvent<HTMLElement>, value: number) => {
    e.preventDefault();
    void copyText(formatFull(value));
  };

  const summaryArrayText = (xs: number[]) => xs.map((v) => (Number.isFinite(v) ? String(v) : "")).join(", ");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-xl font-bold">Build / Inspect</div>
        <AsyncActionButton
          className={`ml-auto ${buttonTone} tone-button-primary`}
          onClick={onBuildHEN}
          idleLabel="Rebuild"
          loadingLabel="Building..."
          isLoading={isBuildingHEN}
          isDisabled={hasError}
          idleTitle="Build HEN"
          disabledTitle="Fix errors before building."
          loadingTitle="Building HEN..."
        />
      </div>

      <Panel className={panelTone}>
        <div className="font-semibold mb-2 ui-title">Summary</div>
        {!summary ? (
          <div className="text-gray-600 text-sm dark:text-neutral-400">
            Click Rebuild to load summary statistics.
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><span className="opacity-70">Streams</span>: {summary.n_streams}</div>
              <div><span className="opacity-70">Hot</span>: {summary.n_hot}</div>
              <div><span className="opacity-70">Cold</span>: {summary.n_cold}</div>
              <div><span className="opacity-70">Iso / MVR / RK / MHP</span>: {summary.n_iso} / {summary.n_mvr} / {summary.n_rk} / {summary.n_mhp}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div><span className="opacity-70">TGridMethod</span>: {summary.method_tgrid || "-"}</div>
              <div><span className="opacity-70">MVRMethod</span>: {summary.method_mvr || "-"}</div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="opacity-70">Hot utility target</span>:{" "}
                <span title={formatFull(hotUtilityTarget)}>
                  {Number.isFinite(hotUtilityTarget) ? `${formatComposite(hotUtilityTarget)} W` : "-"}
                </span>
              </div>
              <div>
                <span className="opacity-70">Cold utility target</span>:{" "}
                <span title={formatFull(coldUtilityTarget)}>
                  {Number.isFinite(coldUtilityTarget) ? `${formatComposite(coldUtilityTarget)} W` : "-"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-base">Pinch (K)</div>
              <div className="font-mono text-sm break-all">{summaryArrayText(summary.pinch_K)}</div>
              <div className="mt-2 flex items-center gap-2">
                <div className="font-medium text-base">Temperature Nodes (K)</div>
                <button
                  type="button"
                  className={`px-2 py-0.5 text-xs border rounded transition-colors ${buttonTone}`}
                  onClick={() => void copyText(temperatureNodesJson)}
                  disabled={!summary?.t_nodes_K?.length}
                  title={summary?.t_nodes_K?.length ? "Copy all temperature nodes." : "No temperature nodes to copy."}
                >
                  Copy
                </button>
              </div>
              {!temperatureNodes ? (
                <div className="text-gray-600 text-sm dark:text-neutral-400">No temperature nodes.</div>
              ) : (
                <div className="pt-1">
                  <div className="relative h-5">
                    <div className="absolute left-0 right-0 bottom-[10.5px] h-[2px] rounded-full" style={{ background: goldTrackGradient }} />
                    {temperatureNodes.marks.map((x, idx) => (
                      <button
                        key={`${x.value}-${idx}`}
                        type="button"
                        className="absolute -translate-x-1/2 h-2 w-2 rounded-full border z-0 transition-transform duration-150 hover:scale-125 hover:z-10 hover:shadow-[0_0_0_2px_rgba(182,138,58,0.45)] dark:hover:shadow-[0_0_0_2px_rgba(246,205,112,0.55)]"
                        style={{
                          left: `${x.left}%`,
                          bottom: "8px",
                          backgroundColor: goldAt(x.left),
                          borderColor: theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)",
                        }}
                        title={formatFull(x.value)}
                        aria-label={`Temperature node ${formatFull(x.value)} K`}
                        onContextMenu={(e) => void onCopyCell(e, x.value)}
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex items-center justify-between font-mono text-xs text-gray-600 dark:text-neutral-400">
                    <span title={formatFull(temperatureNodes.min)}>min {formatFull(temperatureNodes.min)} K</span>
                    <span title={formatFull(temperatureNodes.max)}>max {formatFull(temperatureNodes.max)} K</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>

      {henPlot ? (
        <Panel className={panelTone}>
          <div className="font-semibold mb-2 ui-title">Composite curve</div>
          <div className="w-full overflow-hidden">
            <PlotlyFigure fig={henPlot} theme={theme} />
          </div>
        </Panel>
      ) : null}

      <Panel className={panelTone}>
        <div className="font-semibold mb-2 ui-title">Problem Table</div>
        {!problem || problem.columns.length === 0 || problem.rows.length === 0 ? (
          <div className="text-gray-600 text-sm dark:text-neutral-400">
            No problem table data yet.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="ui-body border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right bg-white dark:bg-neutral-900/40">#</th>
                  {problem.columns.map((name) => (
                    <th
                      key={name}
                      className={`px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right bg-white dark:bg-neutral-900/40 whitespace-nowrap ${isProblemTempColumn(name) ? "w-[120px]" : ""}`}
                      title={problemColumnTitle(name)}
                    >
                      {problemColumnLabel(name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {problem.rows.map((row, rIdx) => (
                  <tr key={`pt-${rIdx}`} className="hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50">
                    <td className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right text-xs opacity-70">{rIdx + 1}</td>
                    {problem.columns.map((name, cIdx) => {
                      const value = row[cIdx];
                      const full = formatFull(value);
                      const bg = isHeatColumn(name) ? heatBgColor(theme, value, heatMaxAbs) : undefined;
                      return (
                        <td
                          key={`pt-${rIdx}-${name}`}
                          className={`px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right tabular-nums whitespace-nowrap ${isProblemTempColumn(name) ? "w-[120px]" : ""}`}
                          title={full}
                          style={bg ? { backgroundColor: bg } : undefined}
                          onContextMenu={(e) => void onCopyCell(e, value)}
                        >
                          {formatProblem(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className={panelTone}>
        <div className="font-semibold mb-2 ui-title">Composite Curve Data Table</div>
        {!composite || composite.columns.length === 0 || composite.rows.length === 0 ? (
          <div className="text-gray-600 text-sm dark:text-neutral-400">
            No composite curve table data yet.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="ui-body border-collapse min-w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right bg-white dark:bg-neutral-900/40">#</th>
                  {composite.columns.map((name) => (
                    <th key={name} className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right bg-white dark:bg-neutral-900/40 whitespace-nowrap">
                      {compositeColumnLabel(name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {composite.rows.map((row, rIdx) => (
                  <tr key={`cc-${rIdx}`} className="hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50">
                    <td className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right text-xs opacity-70">{rIdx + 1}</td>
                    {composite.columns.map((name, cIdx) => {
                      const value = row[cIdx];
                      const full = formatFull(value);
                      const colorClass =
                        cIdx === hotIdx
                          ? (theme === "dark" ? "text-red-300" : "text-red-700")
                          : cIdx === coldIdx
                            ? (theme === "dark" ? "text-sky-300" : "text-sky-700")
                            : "";
                      return (
                        <td
                          key={`cc-${rIdx}-${name}`}
                          className={`px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right tabular-nums whitespace-nowrap ${colorClass}`}
                          title={full}
                          onContextMenu={(e) => void onCopyCell(e, value)}
                        >
                          {formatComposite(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {copyHint ? (
        <div className="fixed right-5 bottom-5 z-40 text-xs px-2 py-1 rounded border bg-white/95 text-neutral-800 border-neutral-300 dark:bg-neutral-900/95 dark:text-neutral-100 dark:border-neutral-700">
          {copyHint}
        </div>
      ) : null}
    </div>
  );
}
