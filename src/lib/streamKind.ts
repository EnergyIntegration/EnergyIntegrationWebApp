import type { StreamKind, StreamRowUI } from "../types/stream";

export function applyKindCanonicalization(s: StreamRowUI, kind: StreamKind): StreamRowUI {
  let next = { ...s, kind };

  if (kind === "IsothermalFixed") {
    next = {
      ...next,
      Tin: { ...next.Tin, mode: "fixed" },
      Tout: { ...next.Tout, mode: "fixed" },
    };
    next.Tout = { ...next.Tout, unit: next.Tin.unit, value: next.Tin.value, lo: "", hi: "" };
  } else if (kind === "IsothermalVariable") {
    next = {
      ...next,
      Tin: { ...next.Tin, mode: "range" },
      Tout: { ...next.Tout, mode: "range" },
    };
    next.Tout = { ...next.Tout, unit: next.Tin.unit, lo: next.Tin.lo, hi: next.Tin.hi, value: "" };
  } else if (kind === "MVR") {
    next = {
      ...next,
      F: { ...next.F, mode: "fixed" },
      Pin: { ...next.Pin, mode: "range" },
    };
  }

  return next;
}
