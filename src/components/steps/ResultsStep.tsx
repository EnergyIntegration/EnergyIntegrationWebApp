import type { MouseEvent, RefObject } from "react";
import { useMemo } from "react";
import { formatHeat } from "../../lib/formatHeat";
import type {
  CellRef,
  DetailMatrix,
  EconomicReport,
  ReorderPulse,
  ReportRow,
  ResultEdge,
  SolutionReport,
  StreamUnit,
} from "../../types/results";
import { Panel } from "../ui/Panel";

type ResultsStepProps = {
  resultsReady: boolean;
  panelTone: string;
  resultHotOrder: string[];
  resultColdOrder: string[];
  resultEdges: ResultEdge[];
  resultObjValue: number | null;
  solutionReport: SolutionReport | null;
  economicReport: EconomicReport | null;
  hoverCell: CellRef | null;
  selectedCell: CellRef | null;
  reorderPulse: ReorderPulse | null;
  streamDetailUnit: StreamUnit;
  tooltipCell: CellRef | null;
  tooltipPos: { x: number; y: number };
  tooltipLoading: boolean;
  tooltipError: string;
  tooltipMatrix: DetailMatrix | null;
  tooltipRef: RefObject<HTMLDivElement | null>;
  lastHeaderDragAtRef: RefObject<number>;
  onCellLeave: () => void;
  onHeaderDragStart: (axis: "hot" | "cold", index: number) => void;
  onHeaderDrop: (axis: "hot" | "cold", index: number) => void;
  onHeaderDragEnd: () => void;
  onStreamDetail: (name: string, unit: StreamUnit) => void;
  onCellEnter: (hot: string, cold: string, value: number, e: MouseEvent<HTMLTableCellElement>) => void;
  onCellClick: (hot: string, cold: string) => void;
};

const TOOLTIP_MAX = 6;

export function ResultsStep({
  resultsReady,
  panelTone,
  resultHotOrder,
  resultColdOrder,
  resultEdges,
  resultObjValue,
  solutionReport,
  economicReport,
  hoverCell,
  selectedCell,
  reorderPulse,
  streamDetailUnit,
  tooltipCell,
  tooltipPos,
  tooltipLoading,
  tooltipError,
  tooltipMatrix,
  tooltipRef,
  lastHeaderDragAtRef,
  onCellLeave,
  onHeaderDragStart,
  onHeaderDrop,
  onHeaderDragEnd,
  onStreamDetail,
  onCellEnter,
  onCellClick,
}: ResultsStepProps) {
  const resultEdgeMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of resultEdges) {
      m.set(`${e.hot}||${e.cold}`, e.q_total);
    }
    return m;
  }, [resultEdges]);

  const resultMaxHeat = useMemo(() => {
    let max = 0;
    for (const e of resultEdges) {
      const v = Math.abs(e.q_total);
      if (v > max) max = v;
    }
    return max;
  }, [resultEdges]);

  const solutionReportRows = useMemo(() => {
    if (!solutionReport) return [];
    const rows: ReportRow[] = [];
    for (const [key, value] of Object.entries(solutionReport)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        rows.push({ key, value: "", indent: 1 });
        for (const [k2, v2] of Object.entries(value)) {
          rows.push({ key: k2, value: String(v2), indent: 2 });
        }
      } else {
        rows.push({ key, value: String(value ?? ""), indent: 1 });
      }
    }
    return rows;
  }, [solutionReport]);

  const activeRow = hoverCell?.hot ?? selectedCell?.hot ?? null;
  const activeCol = hoverCell?.cold ?? selectedCell?.cold ?? null;

  function handleStreamDetailClick(name: string) {
    if (Date.now() - lastHeaderDragAtRef.current < 250) return;
    onStreamDetail(name, streamDetailUnit);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 h-9">
        <div className="text-xl font-bold">Results</div>
      </div>

      {!resultsReady ? (
        <Panel className={panelTone}>
          <div className="text-gray-600 text-sm dark:text-neutral-400">Run solve to see results.</div>
        </Panel>
      ) : (
        <>
          <Panel className={panelTone}>
            <div className="flex flex-wrap items-center gap-4 ui-body">
              <div><span className="font-semibold">Hot streams:</span> {resultHotOrder.length}</div>
              <div><span className="font-semibold">Cold streams:</span> {resultColdOrder.length}</div>
              {Number.isFinite(resultObjValue ?? NaN) ? (
                <div><span className="font-semibold">Objective:</span> {resultObjValue === null ? "" : <span>{resultObjValue.toFixed(1)}&nbsp;&nbsp;US$/yr</span>}</div>
              ) : null}
            </div>
          </Panel>

          <Panel className={panelTone}>
            <div className="font-semibold mb-2 ui-title">Solution Report</div>
            {solutionReportRows.length === 0 ? (
              <div className="ui-body text-gray-500 dark:text-neutral-400">No solution report.</div>
            ) : (
              <table className="ui-body border-collapse w-full">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">Items</th>
                    <th className="text-left px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {solutionReportRows.map((row, idx) => (
                    <tr key={`${row.key}-${idx}`}>
                      <td
                        className="px-2 py-1 border border-gray-200 dark:border-neutral-800 whitespace-nowrap align-top"
                        style={{ paddingLeft: `${row.indent * 12}px` }}
                      >
                        {row.key}
                      </td>
                      <td className="px-2 py-1 border border-gray-200 dark:border-neutral-800 whitespace-pre-wrap">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel className={panelTone}>
            <div className="font-semibold mb-2 ui-title">Economic Report</div>
            {!economicReport || economicReport.data.length === 0 ? (
              <div className="ui-body text-gray-500 dark:text-neutral-400">No economic report.</div>
            ) : (
              <table className="ui-body border-collapse w-max">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40"></th>
                    {economicReport.column_labels.map((label) => (
                      <th
                        key={label}
                        className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 whitespace-nowrap"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {economicReport.data.map((row, idx) => (
                    <tr key={idx}>
                      <th className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-left whitespace-pre">
                        {economicReport.row_labels[idx] ?? ""}
                      </th>
                      {economicReport.column_labels.map((label, j) => {
                        const isUnitCol = j === 1 || label.toLowerCase().includes("unit");
                        return (
                          <td
                            key={`${idx}-${j}`}
                            className={`px-2 py-1 border border-gray-200 dark:border-neutral-800 ${isUnitCol ? "text-left" : "text-right tabular-nums"}`}
                          >
                            {row?.[j] ?? ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel className={panelTone}>
            <div className="font-semibold mb-2 ui-title">Match matrix</div>
            <div className="matrix-resize" onMouseLeave={onCellLeave}>
              <table className="matrix-table ui-body border-collapse">
                <thead>
                  <tr>
                    <th className="matrix-first-col text-left px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40"></th>
                    {resultColdOrder.map((name, idx) => {
                      const colActive = activeCol === name;
                      const isPulse = reorderPulse?.axis === "cold" && reorderPulse.index === idx;
                      return (
                        <th
                          key={name}
                          className={`text-left px-2 py-1 border border-gray-200 dark:border-neutral-800 cursor-move whitespace-nowrap transition-colors ${colActive ? "bg-amber-100/60 dark:bg-amber-900/30" : "bg-white dark:bg-neutral-900/40"} ${isPulse ? "matrix-reorder-pulse" : ""}`}
                          draggable
                          onDragStart={() => onHeaderDragStart("cold", idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onHeaderDrop("cold", idx)}
                          onDragEnd={onHeaderDragEnd}
                          onClick={() => handleStreamDetailClick(name)}
                          title="Drag to reorder / Click for details"
                        >
                          {name}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {resultHotOrder.map((hot, rIdx) => {
                    const rowActive = activeRow === hot;
                    const isPulse = reorderPulse?.axis === "hot" && reorderPulse.index === rIdx;
                    return (
                      <tr key={hot}>
                        <th
                          className={`matrix-first-col text-left px-2 py-1 border border-gray-200 dark:border-neutral-800 cursor-move whitespace-nowrap transition-colors ${rowActive ? "bg-amber-100/60 dark:bg-amber-900/30" : "bg-white dark:bg-neutral-900/40"} ${isPulse ? "matrix-reorder-pulse" : ""}`}
                          draggable
                          onDragStart={() => onHeaderDragStart("hot", rIdx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onHeaderDrop("hot", rIdx)}
                          onDragEnd={onHeaderDragEnd}
                          onClick={() => handleStreamDetailClick(hot)}
                          title="Drag to reorder / Click for details"
                        >
                          {hot}
                        </th>
                        {resultColdOrder.map((cold) => {
                          const key = `${hot}||${cold}`;
                          const value = resultEdgeMap.get(key) ?? 0;
                          const alpha = value === 0 || resultMaxHeat === 0
                            ? 0
                            : Math.min(0.85, Math.max(0.08, Math.abs(value) / resultMaxHeat));
                          const bg = alpha === 0 ? "transparent" : `rgba(245, 158, 11, ${alpha})`;
                          const rowColActive = rowActive || activeCol === cold;
                          const isHoverCell = hoverCell?.hot === hot && hoverCell?.cold === cold;
                          const isSelectedCell = selectedCell?.hot === hot && selectedCell?.cold === cold;
                          const cellShadow = isSelectedCell && isHoverCell
                            ? "inset 0 0 0 2px rgba(249, 115, 22, 0.95), inset 0 0 0 4px rgba(59, 130, 246, 0.9)"
                            : isHoverCell
                              ? "inset 0 0 0 2px rgba(249, 115, 22, 0.95)"
                              : isSelectedCell
                                ? "inset 0 0 0 2px rgba(59, 130, 246, 0.9)"
                                : undefined;
                          const cellFilter = rowColActive ? "brightness(1.08)" : undefined;
                          return (
                            <td
                              key={key}
                              className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right tabular-nums transition-all cursor-pointer min-w-[2px]"
                              style={{ backgroundColor: bg, boxShadow: cellShadow, filter: cellFilter }}
                              onMouseEnter={(e) => onCellEnter(hot, cold, value, e)}
                              onClick={() => onCellClick(hot, cold)}
                              title={value === 0 ? "0" : String(value)}
                            >
                              {formatHeat(value)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {tooltipCell ? (
              <div
                className="matrix-tooltip"
                ref={tooltipRef}
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
              >
                <div className="text-xs font-semibold mb-1">{tooltipCell.hot} {"->"} {tooltipCell.cold}</div>
                {tooltipLoading ? (
                  <div className="text-xs text-gray-500 dark:text-neutral-400">Loading...</div>
                ) : tooltipError ? (
                  <div className="text-xs text-red-600 dark:text-red-400">{tooltipError}</div>
                ) : tooltipMatrix ? (
                  <>
                    <table className="text-[10px] border-collapse">
                      <thead>
                        <tr>
                          <th className="text-center px-1 py-0.5 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40"></th>
                          {tooltipMatrix.cols.slice(0, TOOLTIP_MAX).map((c) => (
                            <th
                              key={c}
                              className="text-center px-1 py-0.5 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 whitespace-nowrap"
                            >
                              {c}
                            </th>
                          ))}
                          {tooltipMatrix.cols.length > TOOLTIP_MAX ? (
                            <th className="text-center px-1 py-0.5 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">...</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {tooltipMatrix.rows.slice(0, TOOLTIP_MAX).map((r, i) => (
                          <tr key={r}>
                            <th className="text-center px-1 py-0.5 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 whitespace-nowrap">
                              {r}
                            </th>
                            {tooltipMatrix.cols.slice(0, TOOLTIP_MAX).map((c, j) => {
                              const v = tooltipMatrix.q?.[i]?.[j] ?? 0;
                              return (
                                <td
                                  key={`${r}||${c}`}
                                  className="px-1 py-0.5 border border-gray-200 dark:border-neutral-800 text-right tabular-nums"
                                >
                                  {formatHeat(v)}
                                </td>
                              );
                            })}
                            {tooltipMatrix.cols.length > TOOLTIP_MAX ? (
                              <td className="px-1 py-0.5 border border-gray-200 dark:border-neutral-800 text-right">...</td>
                            ) : null}
                          </tr>
                        ))}
                          {tooltipMatrix.rows.length > TOOLTIP_MAX ? (
                            <tr>
                              <th className="text-center px-1 py-0.5 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">...</th>
                              {Array.from({ length: Math.min(TOOLTIP_MAX, tooltipMatrix.cols.length) + (tooltipMatrix.cols.length > TOOLTIP_MAX ? 1 : 0) }).map((_, idx) => (
                                <td key={idx} className="px-1 py-0.5 border border-gray-200 dark:border-neutral-800 text-right">...</td>
                              ))}
                            </tr>
                          ) : null}
                      </tbody>
                    </table>
                    {tooltipMatrix.rows.length > TOOLTIP_MAX || tooltipMatrix.cols.length > TOOLTIP_MAX ? (
                      <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1">
                        Showing {Math.min(tooltipMatrix.rows.length, TOOLTIP_MAX)}x{Math.min(tooltipMatrix.cols.length, TOOLTIP_MAX)} of {tooltipMatrix.rows.length}x{tooltipMatrix.cols.length}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </Panel>
        </>
      )}
    </div>
  );
}
