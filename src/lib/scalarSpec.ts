import type { ScalarSpecUI } from "../types/stream";

export function enforceMode(spec: ScalarSpecUI, mode: ScalarSpecUI["mode"]): ScalarSpecUI {
  if (spec.mode === mode) return spec;
  if (mode === "fixed") {
    const value = spec.value || spec.lo || spec.hi || "";
    return { ...spec, mode: "fixed", value, lo: "", hi: "" };
  }
  const lo = spec.lo || spec.value || "";
  const hi = spec.hi || spec.value || "";
  return { ...spec, mode: "range", value: "", lo, hi };
}

export function toggleMode(spec: ScalarSpecUI): ScalarSpecUI {
  return spec.mode === "fixed" ? enforceMode(spec, "range") : enforceMode(spec, "fixed");
}

export function mirrorToutFromTin(tin: ScalarSpecUI, prevTout: ScalarSpecUI): ScalarSpecUI {
  if (tin.mode === "fixed") {
    return { ...prevTout, mode: "fixed", unit: tin.unit, value: tin.value, lo: "", hi: "" };
  }
  return { ...prevTout, mode: "range", unit: tin.unit, value: "", lo: tin.lo, hi: tin.hi };
}

