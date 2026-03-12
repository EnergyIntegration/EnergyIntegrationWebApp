export type ThermalKind = "hot" | "cold";
export type StreamKind =
  | "Common"
  | "IsothermalFixed"
  | "IsothermalVariable"
  | "MVR"
  | "MHP"
  | "RankineCycle";
export type PricingBasis = "Energy" | "Power";

export type ScalarMode = "fixed" | "range";

/** Scalar/range input used by the UI. Empty strings mean the field is not filled. */
export interface ScalarSpecUI {
  mode: ScalarMode;
  unit: string;
  value: string; // fixed
  lo: string;    // range
  hi: string;    // range
}

export interface UnitNumberUI {
  unit: string;
  value: string; // empty is allowed
}

export interface StreamRowUI {
  id: string;          // frontend-internal unique ID
  name: string;        // no colon, e.g. "h1"
  thermal: ThermalKind;
  kind: StreamKind;

  F: ScalarSpecUI;      // mol/s
  Tin: ScalarSpecUI;    // temperature
  Tout: ScalarSpecUI;   // temperature
  Pin: ScalarSpecUI;    // pressure
  Pout: ScalarSpecUI;   // pressure

  fracText: string;     // "0.5,0.5" style input
  // thermophysical & costing
  useAdvancedHcoeff: boolean;
  Cp: UnitNumberUI;     // simplified model: constant Cp -> Hcoeff=(0,Cp,0,0,0,0)
  Hcoeff6: string[];    // advanced: 6 terms
  Hvap: UnitNumberUI;
  HTC: UnitNumberUI;
  Tcont: UnitNumberUI;
  cost: UnitNumberUI;
  pricing_basis: PricingBasis;

  // special cases
  min_TD: UnitNumberUI;
  superheating_deg: UnitNumberUI;
  subcooling_deg: UnitNumberUI;
}

export type NodeRuleUI = "inlet" | "inout" | "custom";
export type TGridMethodUI = "default" | "limit_span" | "cap_count" | "both";
export type MVRMethodUI = "gdp" | "piecewise";

export interface ForbiddenMatchUI {
  id: string;
  hot: string;
  cold: string;
  Q_lb: string;
  Q_ub: string;
}

export interface MVRConfigUI {
  method: MVRMethodUI;
  mode: string;
  step_ratio: string;
  isentropic_efficiency: string;
  polytropic_efficiency: string;
  mechanical_efficiency: string;
}

export interface IntervalsConfigUI {
  forbidden_match: ForbiddenMatchUI[];
  node_rule: NodeRuleUI;
  T_interval_method: TGridMethodUI;
  T_nodes_specified_text: string;
  maxDeltaT: string;
  maxnumT: string;
  mvr_config: MVRConfigUI;
  use_clapeyron: boolean;
}

export type LMTDMethodUI = "accurate" | "harmonic_approx" | "log_shifted" | "log_smooth_eps";
export type LinearizationMethodUI = "none" | "hull" | "jump_sos2" | "pwlopt";
export type AreaCostFormUI = "original" | "ε_shifted";
export type ModelKindUI = "linear" | "nonlinear";
export type IncludeZeroUI = "default" | "no";

export interface LMTDConfigUI {
  method: LMTDMethodUI;
  eps: string;
  minDeltaT: string;
  maxDeltaT: string;
}

export interface PWLConfigUI {
  method: LinearizationMethodUI;
  nsegs: string;
  min_area: string;
  max_area: string;
  include_zero: IncludeZeroUI;
}

export interface ScalingConfigUI {
  Q: string;
  A: string;
  DeltaT: string;
  LMTD: string;
  cost: string;
}

export interface CostModelConfigUI {
  HE_cost_intercept: string;
  HE_cost_slope: string;
  HE_cost_exponent: string;
  comp_cost_intercept: string;
  comp_cost_slope: string;
  comp_cost_exponent: string;
  electricity_price: string;
  annualization_factor: string;
  annual_operating_time: string;
  area_form: AreaCostFormUI;
}

export interface OptimizationConfigUI {
  lmtd: LMTDConfigUI;
  pwl: PWLConfigUI;
  scaling: ScalingConfigUI;
  cost: CostModelConfigUI;
  model_kind: ModelKindUI;
  mvr_atleast: string;
  mvr_select_text: string;
  mhp_atleast: string;
  mhp_select_text: string;
  rc_atleast: string;
  rc_select_text: string;
  warm_start: boolean;
  ratio_constraint: boolean;
  // NOTE: ε / area_atol / q_atol are intentionally omitted from UI.
}
