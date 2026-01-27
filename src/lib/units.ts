import type { ScalarSpecUI, UnitNumberUI } from "../types/stream";

export function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

export function asRange(spec: ScalarSpecUI): { lo: number; hi: number } | null {
  if (spec.mode !== "range") return null;
  const lo = parseNum(spec.lo);
  const hi = parseNum(spec.hi);
  if (lo === null || hi === null) return null;
  return { lo, hi };
}

export function asFixed(spec: ScalarSpecUI): number | null {
  if (spec.mode !== "fixed") return null;
  return parseNum(spec.value);
}

export function minmaxOfSpec(spec: ScalarSpecUI): { min: number; max: number } | null {
  if (spec.mode === "fixed") {
    const v = asFixed(spec);
    if (v === null) return null;
    return { min: v, max: v };
  }
  const r = asRange(spec);
  if (!r) return null;
  return { min: Math.min(r.lo, r.hi), max: Math.max(r.lo, r.hi) };
}

/* ------------------ unit conversions to SI ------------------ */
/* 温度: K；压强: Pa；流量: mol/s；ΔT: K；HTC: W/(m^2*K)；Hvap: J/mol；Cp: J/(mol*K) */

export function toSI_T(v: number, unit: string): number {
  if (unit === "K") return v;
  if (unit === "°C") return v + 273.15;
  return v; // 默认当作 K
}

export function toSI_dT(v: number, unit: string): number {
  if (unit === "K" || unit === "°C") return v;
  return v;
}

export function toSI_flow(v: number, unit: string): number {
  if (unit === "mol/s") return v;
  if (unit === "kmol/h") return (v * 1000.0) / 3600.0;
  if (unit === "kmol/s") return v * 1000.0;
  return v; // 默认 mol/s
}

export function toSI_pressure(v: number, unit: string): number {
  if (unit === "Pa") return v;
  if (unit === "kPa") return v * 1e3;
  if (unit === "MPa") return v * 1e6;
  if (unit === "bar") return v * 1e5;
  return v; // 默认 Pa
}

export function toSI_Cp(v: number, unit: string): number {
  if (unit === "J/(mol*K)") return v;
  if (unit === "kJ/(mol*K)") return v * 1e3;
  if (unit === "MJ/(mol*K)") return v * 1e6;
  return v;
}

export function toSI_Hvap(v: number, unit: string): number {
  if (unit === "J/mol") return v;
  if (unit === "kJ/mol") return v * 1e3;
  if (unit === "MJ/mol") return v * 1e6;
  return v;
}

export function toSI_HTC(v: number, unit: string): number {
  if (unit === "W/(m^2*K)") return v;
  if (unit === "kW/(m^2*K)") return v * 1e3;
  return v;
}

export function toSI_unitNumber(u: UnitNumberUI, conv: (v: number, unit: string) => number): number | null {
  const v = parseNum(u.value);
  if (v === null) return null;
  return conv(v, u.unit);
}

export function toSI_scalarSpec_T(spec: ScalarSpecUI): number | [number, number] | null {
  if (spec.mode === "fixed") {
    const v = asFixed(spec);
    if (v === null) return null;
    return toSI_T(v, spec.unit);
  } else {
    const r = asRange(spec);
    if (!r) return null;
    return [toSI_T(r.lo, spec.unit), toSI_T(r.hi, spec.unit)];
  }
}

export function toSI_scalarSpec_flow(spec: ScalarSpecUI): number | [number, number] | null {
  if (spec.mode === "fixed") {
    const v = asFixed(spec);
    if (v === null) return null;
    return toSI_flow(v, spec.unit);
  } else {
    const r = asRange(spec);
    if (!r) return null;
    return [toSI_flow(r.lo, spec.unit), toSI_flow(r.hi, spec.unit)];
  }
}

export function toSI_scalarSpec_pressure(spec: ScalarSpecUI): number | [number, number] | null {
  if (spec.mode === "fixed") {
    const v = asFixed(spec);
    if (v === null) return null;
    return toSI_pressure(v, spec.unit);
  } else {
    const r = asRange(spec);
    if (!r) return null;
    return [toSI_pressure(r.lo, spec.unit), toSI_pressure(r.hi, spec.unit)];
  }
}
