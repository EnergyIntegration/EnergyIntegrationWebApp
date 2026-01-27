import type { ReactNode } from "react";
import type { StreamRowUI } from "../types/stream";

export type ExtraColumnKey = "Pin" | "Pout" | "Cp" | "HTC" | "Tcont" | "cost";
export type ExtraColumnVisibility = Record<ExtraColumnKey, boolean>;

export type ExtraColumnDef = {
  key: ExtraColumnKey;
  label: ReactNode;
  renderShort: (s: StreamRowUI) => ReactNode;
};

function fmtScalarSpecShort(spec: { mode: string; value: string; lo: string; hi: string; unit: string }) {
  if (spec.mode === "fixed") return spec.value ? `${spec.value} ${spec.unit}` : "-";
  if (spec.lo && spec.hi) return `${spec.lo}-${spec.hi} ${spec.unit}`;
  return "-";
}

function fmtUnitNumberShort(u: { value: string; unit: string }) {
  const v = u.value.trim();
  if (!v) return "-";
  const unit = u.unit.trim();
  if (!unit || unit === "-") return v;
  return `${v} ${unit}`;
}

export const EXTRA_COLUMN_DEFS: ExtraColumnDef[] = [
  { key: "Pin", label: <span>P<sub>in</sub></span>, renderShort: (s) => fmtScalarSpecShort(s.Pin) },
  { key: "Pout", label: <span>P<sub>out</sub></span>, renderShort: (s) => fmtScalarSpecShort(s.Pout) },
  { key: "Cp", label: <span>Cp</span>, renderShort: (s) => fmtUnitNumberShort(s.Cp) },
  { key: "HTC", label: <span>HTC</span>, renderShort: (s) => fmtUnitNumberShort(s.HTC) },
  { key: "Tcont", label: <span>Tcont</span>, renderShort: (s) => fmtUnitNumberShort(s.Tcont) },
  { key: "cost", label: <span>cost</span>, renderShort: (s) => fmtUnitNumberShort(s.cost) },
];
