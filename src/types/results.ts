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

export const STREAM_UNITS = ["°C", "K", "°F", "°R"] as const;
export type StreamUnit = (typeof STREAM_UNITS)[number];
