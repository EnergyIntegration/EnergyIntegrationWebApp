export type ResultEdge = {
  hot: string;
  cold: string;
  q_total: number;
};

export type SolutionReportValue = string | Record<string, string>;
export type SolutionReport = Record<string, SolutionReportValue>;

export type ReportRow = {
  key: string;
  value: string;
  indent: number;
};

export type EconomicReport = {
  column_labels: string[];
  row_labels: string[];
  data: string[][];
};

export type CellRef = {
  hot: string;
  cold: string;
};

export type ReorderPulse = {
  axis: "hot" | "cold";
  index: number;
  token: number;
};

export type DetailMatrix = {
  hot: string;
  cold: string;
  rows: string[];
  cols: string[];
  q: number[][];
};

export type StreamDetail = {
  name: string;
  unit: string;
  q_str: string[];
  describes: string[];
  t_upper: number[];
  t_lower: number[];
};

export type BuildInspectSummary = {
  n_streams: number;
  n_hot: number;
  n_cold: number;
  n_iso: number;
  n_mvr: number;
  n_rk: number;
  n_mhp: number;
  method_tgrid: string;
  method_mvr: string;
  pinch_K: number[];
  t_nodes_K: number[];
};

export type BuildInspectTable = {
  columns: string[];
  rows: number[][];
};

export type BuildInspectPayload = {
  summary: BuildInspectSummary;
  problem_table: BuildInspectTable;
  composite_curve: BuildInspectTable;
};

export const STREAM_UNITS = ["°C", "K", "°F", "°R"] as const;
export type StreamUnit = (typeof STREAM_UNITS)[number];
