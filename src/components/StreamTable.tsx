import { Fragment, useEffect, useMemo, useState } from "react";
import { StreamDetail } from "./StreamDetail";
import { ScalarSpecInline } from "./ScalarSpecInline";
import { applyKindCanonicalization } from "../lib/streamKind";
import { EXTRA_COLUMN_DEFS, type ExtraColumnKey, type ExtraColumnVisibility } from "../lib/columns";
import { enforceMode, mirrorToutFromTin } from "../lib/scalarSpec";
import type { ScalarSpecUI, StreamKind, StreamRowUI, ThermalKind } from "../types/stream";
import type { Theme } from "../types/theme";

const kindOptions: StreamKind[] = [
  "Common",
  "IsothermalFixed",
  "IsothermalVariable",
  "MVR",
  "MHP",
  "RankineCycle",
];
const thermalOptions: ThermalKind[] = ["hot", "cold"];
const flowUnits = ["mol/s", "kmol/h", "kmol/s"] as const;
const tempUnits = ["°C", "K"] as const;
export type ColumnKey = ExtraColumnKey;
export type ColumnVisibility = ExtraColumnVisibility;

function isIsoKind(kind: StreamKind): boolean {
  return kind === "IsothermalFixed" || kind === "IsothermalVariable";
}

function isFixedOnlyKindForF(kind: StreamKind): boolean {
  return kind === "MVR";
}

export function StreamTable(props: {
  streams: StreamRowUI[];
  onUpdate: (id: string, next: StreamRowUI) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  theme: Theme;
  visibleColumns: ColumnVisibility;
}) {
  const { streams, onUpdate, onDelete, onDuplicate, theme, visibleColumns } = props;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // 清理已删除行的展开状态
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set<string>();
      for (const s of streams) if (prev.has(s.id)) next.add(s.id);
      return next;
    });
  }, [streams]);

  const extraColumns = useMemo(() => {
    return EXTRA_COLUMN_DEFS.filter((d) => visibleColumns[d.key]);
  }, [visibleColumns]);

  const panelSurface = "bg-white text-neutral-900 dark:bg-neutral-950/60 dark:text-neutral-100";
  const stickyBg = "bg-white dark:bg-neutral-950/60";
  const headerBg = "bg-gray-50 dark:bg-neutral-900/60";
  const borderTone = "border-gray-200 dark:border-neutral-800";
  const cellTone = "border-neutral-300 bg-white text-neutral-900 placeholder:text-gray-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600";
  const summaryColMinWidthPx = 184;
  const cellPad = "px-[0.375rem] py-[0.45rem]";
  const colW = {
    name: "96px",
    type: "80px",
    kind: "120px",
    actions: "120px",
  } as const;
  const fixedColsPx = (s: string) => (s.endsWith("rem") ? Number.parseFloat(s) * 16 : Number.parseFloat(s) || 0);
  const fixedMinWidthPx = fixedColsPx(colW.name) + fixedColsPx(colW.type) + fixedColsPx(colW.kind) + fixedColsPx(colW.actions);
  const tableMinWidthPx = fixedMinWidthPx + (3 + extraColumns.length) * summaryColMinWidthPx;

  function applySpecUpdate(s: StreamRowUI, key: "F" | "Tin" | "Tout", nextSpec: ScalarSpecUI): StreamRowUI {
    let spec = nextSpec;
    if (key === "F" && isFixedOnlyKindForF(s.kind)) spec = enforceMode(spec, "fixed");
    if ((key === "Tin" || key === "Tout") && s.kind === "IsothermalFixed") spec = enforceMode(spec, "fixed");
    if ((key === "Tin" || key === "Tout") && s.kind === "IsothermalVariable") spec = enforceMode(spec, "range");

    if (key === "Tout" && isIsoKind(s.kind)) {
      return { ...s, Tout: mirrorToutFromTin(s.Tin, s.Tout) };
    }

    const next: StreamRowUI = { ...s, [key]: spec } as StreamRowUI;
    if (key === "Tin" && isIsoKind(s.kind)) {
      next.Tout = mirrorToutFromTin(spec, next.Tout);
    }
    return next;
  }

  return (
    <div className={`border rounded overflow-auto tone-panel ${panelSurface}`}>
      <table
        className="w-full table-fixed text-sm text-neutral-900 dark:text-neutral-100"
        style={{ minWidth: `${tableMinWidthPx}px` }}
      >
        <colgroup>
          <col style={{ width: colW.name }} />
          <col style={{ width: colW.type }} />
          <col style={{ width: colW.kind }} />
          <col />
          <col />
          <col />
          {extraColumns.map((c) => <col key={c.key} />)}
          <col style={{ width: colW.actions }} />
        </colgroup>
        <thead className={headerBg}>
          <tr className="text-left">
            <th className={`${cellPad} sticky left-0 z-20 ${headerBg}`}>Name</th>
            <th className={`${cellPad} ${headerBg}`}>Type</th>
            <th className={`${cellPad} ${headerBg}`}>Kind</th>
            <th className={`${cellPad} ${headerBg}`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>F</th>
            <th className={`${cellPad} ${headerBg}`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>T<sub>in</sub></th>
            <th className={`${cellPad} ${headerBg}`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>T<sub>out</sub></th>
            {extraColumns.map((col) => (
              <th key={col.key} className={`${cellPad} ${headerBg}`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>{col.label}</th>
            ))}
            <th className={`${cellPad} sticky right-0 z-20 ${headerBg}`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {streams.map((s) => {
            const active = expanded.has(s.id);
            const baseRow = "hover:bg-gray-50 dark:hover:bg-neutral-900/40";
            const activeRow = "bg-gray-50 dark:bg-neutral-900/60";
            return (
              <Fragment key={s.id}>
                <tr className={`${active ? activeRow : baseRow} align-top`}>
                  <td className={`${cellPad} sticky left-0 z-10 ${stickyBg} ${active ? activeRow : ""}`}>
                    <input
                      className={`control-h w-full border rounded px-2 py-1 ${cellTone}`}
                      value={s.name}
                      onChange={(e) => onUpdate(s.id, { ...s, name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="h1"
                    />
                  </td>

                  <td className={cellPad}>
                    <select
                      className={`control-h w-full border rounded pl-1 pr-0.8 py-1 ${cellTone}`}
                      value={s.thermal}
                      onChange={(e) => {
                        const thermal = e.target.value as ThermalKind;
                        onUpdate(s.id, { ...s, thermal });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {thermalOptions.map((t) => <option value={t} key={t}>{t}</option>)}
                    </select>
                  </td>

                  <td className={cellPad}>
                    <select
                      className={`control-h w-full border rounded pl-1 pr-0.8 py-1 ${cellTone}`}
                      value={s.kind}
                      onChange={(e) => {
                        const kind = e.target.value as StreamKind;
                        onUpdate(s.id, applyKindCanonicalization(s, kind));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {kindOptions.map((k) => <option value={k} key={k}>{k}</option>)}
                    </select>
                  </td>

                  <td className={`${cellPad} align-middle`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>
                    <ScalarSpecInline
                      spec={s.F}
                      unitOptions={[...flowUnits]}
                      onChange={(nextSpec) => onUpdate(s.id, applySpecUpdate(s, "F", nextSpec))}
                      theme={theme}
                      enabledToneClassName={cellTone}
                      lockMode={isFixedOnlyKindForF(s.kind)}
                      stopPropagation
                    />
                  </td>
                  <td className={`${cellPad} align-middle`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>
                    <ScalarSpecInline
                      spec={s.Tin}
                      unitOptions={[...tempUnits]}
                      onChange={(nextSpec) => onUpdate(s.id, applySpecUpdate(s, "Tin", nextSpec))}
                      theme={theme}
                      enabledToneClassName={cellTone}
                      lockMode={s.kind === "IsothermalFixed" || s.kind === "IsothermalVariable"}
                      stopPropagation
                    />
                  </td>
                  <td className={`${cellPad} align-middle`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>
                    <ScalarSpecInline
                      spec={s.Tout}
                      unitOptions={[...tempUnits]}
                      onChange={(nextSpec) => onUpdate(s.id, applySpecUpdate(s, "Tout", nextSpec))}
                      theme={theme}
                      enabledToneClassName={cellTone}
                      disabled={isIsoKind(s.kind)}
                      lockMode={s.kind === "IsothermalFixed" || s.kind === "IsothermalVariable"}
                      stopPropagation
                    />
                  </td>

                  {extraColumns.map((col) => (
                    <td key={col.key} className={`${cellPad} align-middle`} style={{ minWidth: `${summaryColMinWidthPx}px` }}>
                      <div className="control-h flex items-center">
                        {col.renderShort(s)}
                      </div>
                    </td>
                  ))}

                  <td className={`${cellPad} sticky right-0 z-10 ${stickyBg} ${active ? activeRow : ""}`}>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 border rounded tone-button-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(s.id)) next.delete(s.id);
                            else next.add(s.id);
                            return next;
                          });
                        }}
                        title={active ? "Collapse" : "Expand details"}
                      >
                        {active ? "▾" : "▸"}
                      </button>
                      <button
                        className="px-2 py-1 border rounded tone-button-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(s.id);
                        }}
                        title="Duplicate stream"
                      >
                        ⧉
                      </button>
                      <button
                        className="px-2 py-1 border rounded tone-button-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            next.delete(s.id);
                            return next;
                          });
                          onDelete(s.id);
                        }}
                        title="Delete stream"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
                {active ? (
                  <tr className="bg-white dark:bg-neutral-950">
                    <td className={`p-0 border-t ${borderTone}`} colSpan={7 + extraColumns.length}>
                      <div className="sticky left-0 w-full max-w-[calc(100vw-2rem)]">
                        <StreamDetail
                          stream={s}
                          onChange={(next) => onUpdate(next.id, next)}
                          theme={theme}
                        />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
          {streams.length === 0 ? (
            <tr>
              <td className="p-3 text-gray-500 dark:text-neutral-400" colSpan={7 + extraColumns.length}>No streams. Add one.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
