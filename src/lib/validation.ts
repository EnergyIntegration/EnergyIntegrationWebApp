import type { IntervalsConfigUI, StreamRowUI } from "../types/stream";
import { minmaxOfSpec, parseNum } from "./units";

export type IssueLevel = "error" | "warn";
export interface Issue {
  level: IssueLevel;
  streamId: string;
  field?: string;
  message: string;
}

const TOL_T = 1e-6;
const TOL_POS = 0.0;

function approxEqual(a: number, b: number, tol: number = TOL_T): boolean {
  return Math.abs(a - b) <= tol;
}

function parseNumberList(text: string): number[] {
  const t = text.trim();
  if (!t) return [];
  return t
    .split(/[\s,]+/)
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x));
}

export function validateIntervalsConfig(cfg: IntervalsConfigUI, streams: StreamRowUI[]): Issue[] {
  const issues: Issue[] = [];
  const streamId = "__intervals__";

  if (cfg.use_clapeyron) {
    issues.push({ level: "error", streamId, field: "use_clapeyron", message: "use_clapeyron requires a mixture (not supported in this web app)" });
  }

  if (cfg.T_interval_method === "limit_span" || cfg.T_interval_method === "both") {
    const v = parseNum(cfg.maxDeltaT);
    if (v === null || !(v > 0)) {
      issues.push({ level: "error", streamId, field: "maxDeltaT", message: "maxDeltaT must be > 0 when method is limit_span/both" });
    }
  }

  if (cfg.T_interval_method === "cap_count" || cfg.T_interval_method === "both") {
    const n = parseNum(cfg.maxnumT);
    if (n === null || !(Number.isInteger(n) && n > 0)) {
      issues.push({ level: "error", streamId, field: "maxnumT", message: "maxnumT must be an integer > 0 when method is cap_count/both" });
    }
  }

  if (cfg.node_rule === "custom") {
    const xs = parseNumberList(cfg.T_nodes_specified_text);
    if (xs.length === 0) {
      issues.push({ level: "error", streamId, field: "T_nodes_specified", message: "custom node_rule requires T_nodes_specified (K) list" });
    } else {
      for (let i = 0; i < xs.length - 1; i++) {
        if (xs[i] < xs[i + 1] - TOL_T) {
          issues.push({ level: "warn", streamId, field: "T_nodes_specified", message: "T_nodes_specified should be descending in K" });
          break;
        }
      }
    }
  } else {
    if (cfg.T_nodes_specified_text.trim()) {
      issues.push({ level: "warn", streamId, field: "T_nodes_specified", message: "T_nodes_specified will be ignored unless node_rule is custom" });
    }
  }

  if (!cfg.mvr_config.mode.trim()) {
    issues.push({ level: "warn", streamId, field: "mvr_config.mode", message: "mvr_config.mode is empty" });
  }

  const stepRatio = parseNum(cfg.mvr_config.step_ratio);
  if (stepRatio === null || !(stepRatio > 0)) {
    issues.push({ level: "error", streamId, field: "mvr_config.step_ratio", message: "mvr_config.step_ratio must be > 0" });
  }

  for (const k of ["isentropic_efficiency", "polytropic_efficiency", "mechanical_efficiency"] as const) {
    const v = parseNum(cfg.mvr_config[k]);
    if (v === null || !(v > 0 && v <= 1)) {
      issues.push({ level: "error", streamId, field: `mvr_config.${k}`, message: `${k} must be in (0, 1]` });
    }
  }

  const knownNames = new Set(streams.map((s) => s.name.trim()).filter(Boolean));
  for (const row of cfg.forbidden_match) {
    const hot = row.hot.trim();
    const cold = row.cold.trim();
    const anyFilled = hot || cold || row.Q_lb.trim() || row.Q_ub.trim();
    if (!anyFilled) continue;

    if (!hot || !cold) {
      issues.push({ level: "error", streamId, field: "forbidden_match", message: "forbidden_match rows require hot and cold stream names" });
      continue;
    }
    if (knownNames.size > 0 && (!knownNames.has(hot) || !knownNames.has(cold))) {
      issues.push({ level: "warn", streamId, field: "forbidden_match", message: `unknown stream name(s) in forbidden_match: ${hot}, ${cold}` });
    }

    const lb = parseNum(row.Q_lb);
    const ub = parseNum(row.Q_ub);
    if (lb === null || ub === null) {
      issues.push({ level: "error", streamId, field: "forbidden_match", message: "forbidden_match Q_lb/Q_ub must be numbers" });
      continue;
    }
    if (lb > ub) {
      issues.push({ level: "error", streamId, field: "forbidden_match", message: "forbidden_match requires Q_lb ≤ Q_ub" });
    } else if (lb === 0 && ub === 0) {
      issues.push({ level: "warn", streamId, field: "forbidden_match", message: `forbid match (${hot}, ${cold})` });
    }
  }

  return issues;
}

export function validateStream(s: StreamRowUI): Issue[] {
  const issues: Issue[] = [];

  if (!s.name.trim()) {
    issues.push({ level: "error", streamId: s.id, field: "name", message: "name is required" });
  }

  // Range sanity
  for (const key of ["F", "Tin", "Tout", "Pin", "Pout"] as const) {
    const spec = s[key];
    if (spec.mode === "range") {
      const lo = parseNum(spec.lo);
      const hi = parseNum(spec.hi);
      if (lo === null || hi === null) {
        issues.push({ level: "error", streamId: s.id, field: key, message: `${key}: range requires lo and hi` });
      } else if (lo > hi) {
        issues.push({ level: "warn", streamId: s.id, field: key, message: `${key}: lo > hi (will be canonicalized)` });
      }
    } else {
      const v = parseNum(spec.value);
      if (v === null) {
        // allow empty for Pin/Pout in non-MVR
        if ((key === "Pin" || key === "Pout") && s.kind !== "MVR") continue;
        issues.push({ level: "error", streamId: s.id, field: key, message: `${key}: value is required` });
      }
    }
  }

  // kind-specific
  const Tin = minmaxOfSpec(s.Tin);
  const Tout = minmaxOfSpec(s.Tout);

  if (s.kind === "IsothermalFixed" || s.kind === "IsothermalVariable") {
    // Require Tin == Tout (we only compare min/max here; UI会同步两者)
    if (!Tin || !Tout) {
      issues.push({ level: "error", streamId: s.id, field: "Tin/Tout", message: "isothermal requires Tin and Tout" });
    } else {
      if (!approxEqual(Tin.min, Tout.min) || !approxEqual(Tin.max, Tout.max)) {
        issues.push({ level: "error", streamId: s.id, field: "Tin/Tout", message: "isothermal requires Tin ≡ Tout" });
      }
    }

    // Fixed vs Variable
    if (s.kind === "IsothermalFixed") {
      if (s.Tin.mode !== "fixed" || s.Tout.mode !== "fixed") {
        issues.push({ level: "error", streamId: s.id, field: "Tin/Tout", message: "IsothermalFixed requires Tin and Tout fixed" });
      }
    } else {
      if (s.Tin.mode !== "range" || s.Tout.mode !== "range") {
        issues.push({ level: "error", streamId: s.id, field: "Tin/Tout", message: "IsothermalVariable requires Tin and Tout variable (range)" });
      }
    }

    // Hvap > 0
    const hv = parseNum(s.Hvap.value);
    if (hv === null || hv <= 0) {
      issues.push({ level: "error", streamId: s.id, field: "Hvap", message: "isothermal stream requires Hvap > 0" });
    }
  } else {
    // Non-isothermal requires Tout
    if (!Tout) {
      issues.push({ level: "error", streamId: s.id, field: "Tout", message: "non-isothermal stream requires Tout" });
    }

    // Hot: Tin >= Tout, Cold: Tout >= Tin
    if (Tin && Tout) {
      if (s.thermal === "hot") {
        if (Tin.min < Tout.max - TOL_T) {
          issues.push({ level: "error", streamId: s.id, field: "Tin/Tout", message: "thermal=hot requires Tin ≥ Tout" });
        }
      } else {
        if (Tout.min < Tin.max - TOL_T) {
          issues.push({ level: "error", streamId: s.id, field: "Tin/Tout", message: "thermal=cold requires Tout ≥ Tin" });
        }
      }
    }

    if (s.kind === "MVR") {
      // MVR requires F fixed, Pin and Pout specified
      if (s.F.mode !== "fixed") {
        issues.push({ level: "error", streamId: s.id, field: "F", message: "MVR requires fixed F" });
      }
      // Pin range hi > lo (strict)
      if (s.Pin.mode !== "range") {
        issues.push({ level: "error", streamId: s.id, field: "Pin", message: "MVR requires Pin to be a range (lo, hi)" });
      } else {
        const lo = parseNum(s.Pin.lo);
        const hi = parseNum(s.Pin.hi);
        if (lo !== null && hi !== null && !(hi > lo)) {
          issues.push({ level: "error", streamId: s.id, field: "Pin", message: "MVR requires Pin.hi > Pin.lo" });
        }
      }
      // Pout required
      const pout = s.Pout.mode === "fixed" ? parseNum(s.Pout.value) : parseNum(s.Pout.lo);
      if (pout === null) {
        issues.push({ level: "error", streamId: s.id, field: "Pout", message: "MVR requires Pout" });
      }
    }
  }

  // HTC >= 0, Tcont/min_TD/super/sub >= 0
  for (const k of ["HTC", "Tcont", "min_TD", "superheating_deg", "subcooling_deg"] as const) {
    const v = parseNum(s[k].value);
    if (v !== null && v < -TOL_POS) {
      issues.push({ level: "error", streamId: s.id, field: k, message: `${k} must be ≥ 0` });
    }
  }

  // Cp/Hcoeff
  if (!s.useAdvancedHcoeff) {
    const cp = parseNum(s.Cp.value);
    if (cp === null) {
      issues.push({ level: "warn", streamId: s.id, field: "Cp", message: "Cp is empty (Hcoeff will be zeros)" });
    }
  } else {
    if (s.Hcoeff6.length !== 6) {
      issues.push({ level: "error", streamId: s.id, field: "Hcoeff6", message: "Hcoeff6 must have 6 entries" });
    } else {
      for (let i = 0; i < 6; i++) {
        const v = parseNum(s.Hcoeff6[i] ?? "");
        if (v === null) {
          issues.push({ level: "error", streamId: s.id, field: "Hcoeff6", message: `Hcoeff6[${i + 1}] is not a number` });
          break;
        }
      }
    }
  }

  // frac parsing warning
  if (s.fracText.trim()) {
    const xs = s.fracText.split(",").map((x) => Number(x.trim())).filter((x) => Number.isFinite(x));
    if (xs.length === 0) {
      issues.push({ level: "warn", streamId: s.id, field: "frac", message: "frac cannot be parsed" });
    }
  }

  return issues;
}

export function validateAll(streams: StreamRowUI[], cfg?: IntervalsConfigUI | null): Issue[] {
  const issues: Issue[] = [];
  const seen = new Map<string, string>(); // name -> streamId
  for (const s of streams) {
    issues.push(...validateStream(s));
    const nm = s.name.trim();
    if (nm) {
      if (seen.has(nm)) {
        issues.push({ level: "error", streamId: s.id, field: "name", message: `duplicate name: ${nm}` });
      } else {
        seen.set(nm, s.id);
      }
    }
  }
  if (cfg) issues.push(...validateIntervalsConfig(cfg, streams));
  return issues;
}
