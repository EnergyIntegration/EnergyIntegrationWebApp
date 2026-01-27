import type { IntervalsConfigUI, StreamRowUI } from "../types/stream";
import {
  parseNum,
  toSI_scalarSpec_flow,
  toSI_scalarSpec_T,
  toSI_scalarSpec_pressure,
  toSI_unitNumber,
  toSI_Cp,
  toSI_Hvap,
  toSI_HTC,
  toSI_dT,
} from "./units";

export interface StreamPayloadSI {
  name: string;
  thermal: string;
  kind: string;

  F: number | [number, number];
  Tin: number | [number, number];
  Tout: number | [number, number];

  Pin: number | [number, number] | null;
  Pout: number | [number, number] | null;

  frac: number[];
  Hcoeff: [number, number, number, number, number, number];
  Hvap: number;
  HTC: number;
  Tcont: number;
  cost: number;
  pricing_basis: string;

  min_TD: number;
  superheating_deg: number;
  subcooling_deg: number;
}

export interface PayloadSI {
  streams: StreamPayloadSI[];
  intervals_config?: IntervalsConfigPayloadSI;
}

export interface ForbiddenMatchPayloadSI {
  hot: string;
  cold: string;
  Q_lb: number;
  Q_ub: number;
}

export interface MVRConfigPayloadSI {
  method: string;
  mode: string;
  step_ratio: number;
  isentropic_efficiency: number;
  polytropic_efficiency: number;
  mechanical_efficiency: number;
}

export interface IntervalsConfigPayloadSI {
  forbidden_match: ForbiddenMatchPayloadSI[];
  node_rule: string;
  T_interval_method: string;
  T_nodes_specified: number[];
  maxDeltaT: number;
  maxnumT: number;
  mvr_config: MVRConfigPayloadSI;
  use_clapeyron: boolean;
}

function parseFrac(fracText: string): number[] {
  const t = fracText.trim();
  if (!t) return [];
  const xs = t.split(",").map((x) => Number(x.trim())).filter((x) => Number.isFinite(x));
  return xs;
}

function parseNumberList(text: string): number[] {
  const t = text.trim();
  if (!t) return [];
  return t
    .split(/[\s,]+/)
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x));
}

function buildIntervalsConfigPayloadSI(cfg: IntervalsConfigUI): IntervalsConfigPayloadSI {
  const maxDeltaT = parseNum(cfg.maxDeltaT) ?? 0;
  const maxnumT = Math.trunc(parseNum(cfg.maxnumT) ?? 0);
  const T_nodes_specified = parseNumberList(cfg.T_nodes_specified_text);

  return {
    forbidden_match: cfg.forbidden_match
      .map((r) => ({
        hot: r.hot.trim(),
        cold: r.cold.trim(),
        Q_lb: parseNum(r.Q_lb) ?? 0,
        Q_ub: parseNum(r.Q_ub) ?? 0,
      }))
      .filter((r) => r.hot && r.cold),
    node_rule: cfg.node_rule,
    T_interval_method: cfg.T_interval_method,
    T_nodes_specified,
    maxDeltaT,
    maxnumT,
    mvr_config: {
      method: cfg.mvr_config.method,
      mode: cfg.mvr_config.mode.trim(),
      step_ratio: parseNum(cfg.mvr_config.step_ratio) ?? 0,
      isentropic_efficiency: parseNum(cfg.mvr_config.isentropic_efficiency) ?? 0,
      polytropic_efficiency: parseNum(cfg.mvr_config.polytropic_efficiency) ?? 0,
      mechanical_efficiency: parseNum(cfg.mvr_config.mechanical_efficiency) ?? 0,
    },
    use_clapeyron: cfg.use_clapeyron,
  };
}

export function buildPayloadSI(streams: StreamRowUI[], intervalsConfig?: IntervalsConfigUI | null): PayloadSI {
  return {
    streams: streams.map((s) => {
      const F = toSI_scalarSpec_flow(s.F);
      const Tin = toSI_scalarSpec_T(s.Tin);
      const Tout = toSI_scalarSpec_T(s.Tout);
      const Pin = (s.kind === "MVR") ? toSI_scalarSpec_pressure(s.Pin) : null;
      const Pout = (s.kind === "MVR") ? toSI_scalarSpec_pressure(s.Pout) : null;

      // Hcoeff6: default using constant Cp
      let h6: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
      if (!s.useAdvancedHcoeff) {
        const cpUI = parseNum(s.Cp.value);
        const cpSI = (cpUI === null) ? 0 : toSI_Cp(cpUI, s.Cp.unit);
        h6 = [0, cpSI, 0, 0, 0, 0];
      } else {
        const a = s.Hcoeff6.map((x) => parseNum(x) ?? 0);
        // 这里默认用户已经输入的是 SI 量纲下的数值
        h6 = [a[0], a[1], a[2], a[3], a[4], a[5]];
      }

      const Hvap = toSI_unitNumber(s.Hvap, toSI_Hvap) ?? 0;
      const HTC = toSI_unitNumber(s.HTC, toSI_HTC) ?? 0;
      const Tcont = toSI_unitNumber(s.Tcont, toSI_dT) ?? 0;

      // cost: 目前不强制单位解析，默认直接数值传给 Julia (你内部是 unitfactor(cost))
      const cost = parseNum(s.cost.value) ?? 0;

      const min_TD = toSI_unitNumber(s.min_TD, toSI_dT) ?? 0;
      const superheating_deg = toSI_unitNumber(s.superheating_deg, toSI_dT) ?? 0;
      const subcooling_deg = toSI_unitNumber(s.subcooling_deg, toSI_dT) ?? 0;

      if (F === null || Tin === null || Tout === null) {
        // 让后端再报错; 这里先给占位
      }

      return {
        name: s.name.trim(),
        thermal: s.thermal,
        kind: s.kind,
        F: (F ?? 0) as any,
        Tin: (Tin ?? 0) as any,
        Tout: (Tout ?? 0) as any,
        Pin: Pin as any,
        Pout: Pout as any,
        frac: parseFrac(s.fracText),
        Hcoeff: h6,
        Hvap,
        HTC,
        Tcont,
        cost,
        pricing_basis: s.pricing_basis,
        min_TD,
        superheating_deg,
        subcooling_deg,
      };
    }),
    intervals_config: intervalsConfig ? buildIntervalsConfigPayloadSI(intervalsConfig) : undefined,
  };
}
