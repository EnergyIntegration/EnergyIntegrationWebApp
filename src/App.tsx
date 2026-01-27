import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import type { ForbiddenMatchUI, IntervalsConfigUI, OptimizationConfigUI, ScalarSpecUI, StreamRowUI } from "./types/stream";
import type { Theme } from "./types/theme";
import type { ColumnVisibility } from "./components/StreamTable";
import { BuildStep } from "./components/steps/BuildStep";
import { ResultsStep } from "./components/steps/ResultsStep";
import { SolveStep } from "./components/steps/SolveStep";
import { StreamsStep } from "./components/steps/StreamsStep";
import { formatHeat } from "./lib/formatHeat";
import { validateAll } from "./lib/validation";
import { buildPayloadSI } from "./lib/payload";
import type { PlotlyFigurePayload } from "./types/plotly";
import type {
  CellRef,
  DetailMatrix,
  EconomicReport,
  ReorderPulse,
  ResultEdge,
  SolutionReport,
  StreamDetail,
  StreamUnit,
} from "./types/results";
import { STREAM_UNITS } from "./types/results";

function emptyScalar(mode: ScalarSpecUI["mode"], unit: string): ScalarSpecUI {
  return { mode, unit, value: "", lo: "", hi: "" };
}

async function readJsonOrText(r: Response): Promise<unknown> {
  const ct = r.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return await r.json();
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

function toBackendResp(r: Response, body: unknown): { status: number; ok: boolean; body: unknown } {
  let nextBody = body;
  if (r.status === 500 && (body === "" || body === null)) {
    nextBody = {
      message: "Backend not started or proxy failure.",
      hint: "Start backend at http://127.0.0.1:8001",
    };
  }
  return { status: r.status, ok: r.ok, body: nextBody };
}

function makeDefaultStream(n: number, thermal: "hot" | "cold"): StreamRowUI {
  const name = thermal === "hot" ? `h${n}` : `c${n}`;
  return {
    id: crypto.randomUUID(),
    name,
    thermal,
    kind: "Common",

    F: emptyScalar("fixed", "mol/s"),
    Tin: emptyScalar("fixed", "°C"),
    Tout: emptyScalar("fixed", "°C"),
    Pin: emptyScalar("fixed", "bar"),
    Pout: emptyScalar("fixed", "bar"),

    fracText: "",

    useAdvancedHcoeff: false,
    Cp: { value: "", unit: "kJ/(mol*K)" },
    Hcoeff6: ["0", "0", "0", "0", "0", "0"],
    Hvap: { value: "", unit: "kJ/mol" },
    HTC: { value: "", unit: "kW/(m^2*K)" },
    Tcont: { value: "", unit: "K" },
    cost: { value: "0", unit: "-" },
    pricing_basis: "Energy",

    min_TD: { value: "0", unit: "K" },
    superheating_deg: { value: "0", unit: "K" },
    subcooling_deg: { value: "0", unit: "K" },
  };
}

function defaultIntervalsConfigUI(): IntervalsConfigUI {
  return {
    forbidden_match: [],
    node_rule: "inout",
    T_interval_method: "default",
    T_nodes_specified_text: "",
    maxDeltaT: "",
    maxnumT: "",
    mvr_config: {
      method: "piecewise",
      mode: "polytropic",
      step_ratio: "0.007",
      isentropic_efficiency: "0.72",
      polytropic_efficiency: "0.75",
      mechanical_efficiency: "0.97",
    },
    use_clapeyron: false,
  };
}

function defaultOptimizationConfigUI(): OptimizationConfigUI {
  return {
    lmtd: {
      method: "accurate",
      eps: "1e-3",
      minDeltaT: "1e-6",
      maxDeltaT: "Inf",
    },
    pwl: {
      method: "none",
      nsegs: "6",
      min_area: "0",
      max_area: "2000",
      include_zero: "default",
    },
    scaling: {
      Q: "1e5",
      A: "10",
      DeltaT: "10",
      LMTD: "10",
      cost: "1",
    },
    cost: {
      HE_cost_intercept: "2000",
      HE_cost_slope: "70",
      HE_cost_exponent: "1",
      comp_cost_intercept: "200000",
      comp_cost_slope: "0.7",
      comp_cost_exponent: "1",
      electricity_price: "3.7583e-8",
      annualization_factor: "0.23739640043118948",
      annual_operating_time: String(3600 * 8000),
      area_form: "ε_shifted",
    },
    model_kind: "linear",
    mvr_atleast: "0",
    mvr_select_text: "",
    mhp_atleast: "0",
    mhp_select_text: "",
    rc_atleast: "0",
    rc_select_text: "",
    warm_start: false,
    ratio_constraint: false,
  };
}

function normalizeIntervalsConfigUI(x: any): IntervalsConfigUI {
  const base = defaultIntervalsConfigUI();
  if (!x || typeof x !== "object") return base;

  const rows: ForbiddenMatchUI[] = Array.isArray(x.forbidden_match) ? x.forbidden_match.map((r: any) => ({
    id: typeof r?.id === "string" ? r.id : crypto.randomUUID(),
    hot: typeof r?.hot === "string" ? r.hot : "",
    cold: typeof r?.cold === "string" ? r.cold : "",
    Q_lb: typeof r?.Q_lb === "string" ? r.Q_lb : String(r?.Q_lb ?? ""),
    Q_ub: typeof r?.Q_ub === "string" ? r.Q_ub : String(r?.Q_ub ?? ""),
  })) : [];

  return {
    forbidden_match: rows,
    node_rule: (x.node_rule === "inlet" || x.node_rule === "inout" || x.node_rule === "custom") ? x.node_rule : base.node_rule,
    T_interval_method: (x.T_interval_method === "default" || x.T_interval_method === "limit_span" || x.T_interval_method === "cap_count" || x.T_interval_method === "both")
      ? x.T_interval_method
      : base.T_interval_method,
    T_nodes_specified_text: typeof x.T_nodes_specified_text === "string" ? x.T_nodes_specified_text : base.T_nodes_specified_text,
    maxDeltaT: typeof x.maxDeltaT === "string" ? x.maxDeltaT : String(x.maxDeltaT ?? base.maxDeltaT),
    maxnumT: typeof x.maxnumT === "string" ? x.maxnumT : String(x.maxnumT ?? base.maxnumT),
    mvr_config: {
      method: (x.mvr_config?.method === "gdp" || x.mvr_config?.method === "piecewise") ? x.mvr_config.method : base.mvr_config.method,
      mode: typeof x.mvr_config?.mode === "string" ? x.mvr_config.mode : base.mvr_config.mode,
      step_ratio: typeof x.mvr_config?.step_ratio === "string" ? x.mvr_config.step_ratio : String(x.mvr_config?.step_ratio ?? base.mvr_config.step_ratio),
      isentropic_efficiency: typeof x.mvr_config?.isentropic_efficiency === "string"
        ? x.mvr_config.isentropic_efficiency
        : String(x.mvr_config?.isentropic_efficiency ?? base.mvr_config.isentropic_efficiency),
      polytropic_efficiency: typeof x.mvr_config?.polytropic_efficiency === "string"
        ? x.mvr_config.polytropic_efficiency
        : String(x.mvr_config?.polytropic_efficiency ?? base.mvr_config.polytropic_efficiency),
      mechanical_efficiency: typeof x.mvr_config?.mechanical_efficiency === "string"
        ? x.mvr_config.mechanical_efficiency
        : String(x.mvr_config?.mechanical_efficiency ?? base.mvr_config.mechanical_efficiency),
    },
    use_clapeyron: Boolean(x.use_clapeyron ?? base.use_clapeyron),
  };
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr.slice();
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function App() {
  type AppStep = "streams" | "build" | "solve" | "results";

  const [streams, setStreams] = useState<StreamRowUI[]>([
    makeDefaultStream(1, "hot"),
    makeDefaultStream(1, "cold"),
  ]);
  const [intervalsOpen, setIntervalsOpen] = useState<boolean>(false);
  const [optOpen, setOptOpen] = useState<boolean>(true);
  const [intervalsConfig, setIntervalsConfig] = useState<IntervalsConfigUI>(() => defaultIntervalsConfigUI());
  const [optConfig, setOptConfig] = useState<OptimizationConfigUI>(() => defaultOptimizationConfigUI());
  const [step, setStep] = useState<AppStep>("streams");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    Pin: false,
    Pout: false,
    Cp: false,
    HTC: false,
    Tcont: false,
    cost: false,
  });
  const [lastStreamsetId, setLastStreamsetId] = useState<string | null>(null);
  const [lastStreamsetFileName, setLastStreamsetFileName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("ei-last-streamset-file");
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("ei-theme") : null;
    if (saved === "light" || saved === "dark") return saved;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
    return "dark";
  });

  const issues = useMemo(() => validateAll(streams, intervalsConfig), [streams, intervalsConfig]);
  const hasError = issues.some((x) => x.level === "error");

  const [uiMsg, setUiMsg] = useState<string>("");
  const [backendResp, setBackendResp] = useState<{ status: number; ok: boolean; body: unknown } | null>(null);
  const [henPlot, setHenPlot] = useState<PlotlyFigurePayload | null>(null);
  const [henReady, setHenReady] = useState<boolean>(false);
  const [resultsReady, setResultsReady] = useState<boolean>(false);
  const [resultHotOrder, setResultHotOrder] = useState<string[]>([]);
  const [resultColdOrder, setResultColdOrder] = useState<string[]>([]);
  const [resultEdges, setResultEdges] = useState<ResultEdge[]>([]);
  const [resultObjValue, setResultObjValue] = useState<number | null>(null);
  const [solutionReport, setSolutionReport] = useState<SolutionReport | null>(null);
  const [economicReport, setEconomicReport] = useState<EconomicReport | null>(null);
  const [hoverCell, setHoverCell] = useState<CellRef | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellRef | null>(null);
  const [reorderPulse, setReorderPulse] = useState<ReorderPulse | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string>("");
  const [detailMatrix, setDetailMatrix] = useState<DetailMatrix | null>(null);
  const [streamDetailOpen, setStreamDetailOpen] = useState<boolean>(false);
  const [streamDetailLoading, setStreamDetailLoading] = useState<boolean>(false);
  const [streamDetailError, setStreamDetailError] = useState<string>("");
  const [streamDetail, setStreamDetail] = useState<StreamDetail | null>(null);
  const [streamDetailUnit, setStreamDetailUnit] = useState<StreamUnit>("°C");
  const [streamDetailName, setStreamDetailName] = useState<string | null>(null);
  const [tooltipCell, setTooltipCell] = useState<CellRef | null>(null);
  const [tooltipLoading, setTooltipLoading] = useState<boolean>(false);
  const [tooltipError, setTooltipError] = useState<string>("");
  const [tooltipMatrix, setTooltipMatrix] = useState<DetailMatrix | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [consoleConnected, setConsoleConnected] = useState<boolean>(false);
  const consoleBoxRef = useRef<HTMLDivElement>(null);
  const consoleEsRef = useRef<EventSource | null>(null);
  const streamsetFileRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{ axis: "hot" | "cold"; index: number } | null>(null);
  const hoverKeyRef = useRef<string | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const detailCacheRef = useRef<Map<string, DetailMatrix>>(new Map());
  const streamDetailCacheRef = useRef<Map<string, StreamDetail>>(new Map());
  const lastHeaderDragAtRef = useRef<number>(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipMouseRef = useRef<{ x: number; y: number } | null>(null);

  function updateStream(id: string, next: StreamRowUI) {
    setStreams((xs) => xs.map((x) => (x.id === id ? next : x)));
  }

  function deleteStream(id: string) {
    setStreams((xs) => xs.filter((x) => x.id !== id));
  }

  function addStream(thermal: "hot" | "cold") {
    const count = streams.filter((s) => s.thermal === thermal).length + 1;
    const s = makeDefaultStream(count, thermal);
    setStreams((xs) => [...xs, s]);
  }

  function duplicateStream(id: string) {
    const src = streams.find((s) => s.id === id);
    if (!src) return;
    const copy: StreamRowUI = { ...src, id: crypto.randomUUID(), name: `${src.name}_copy` };
    setStreams((xs) => [...xs, copy]);
  }

  function handleHeaderDragStart(axis: "hot" | "cold", index: number) {
    dragRef.current = { axis, index };
  }

  function handleHeaderDrop(axis: "hot" | "cold", index: number) {
    const drag = dragRef.current;
    if (!drag || drag.axis !== axis || drag.index === index) return;
    if (axis === "hot") {
      setResultHotOrder((prev) => moveItem(prev, drag.index, index));
    } else {
      setResultColdOrder((prev) => moveItem(prev, drag.index, index));
    }
    const token = Date.now();
    lastHeaderDragAtRef.current = token;
    setReorderPulse({ axis, index, token });
    window.setTimeout(() => {
      setReorderPulse((prev) => (prev?.token === token ? null : prev));
    }, 420);
    dragRef.current = null;
  }

  function handleHeaderDragEnd() {
    dragRef.current = null;
    lastHeaderDragAtRef.current = Date.now();
  }

  function handleCellEnter(hot: string, cold: string, value: number, e: MouseEvent<HTMLTableCellElement>) {
    setHoverCell({ hot, cold });
    if (!Number.isFinite(value) || value === 0) {
      setTooltipCell(null);
      setTooltipLoading(false);
      setTooltipError("");
      setTooltipMatrix(null);
      hoverKeyRef.current = null;
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      return;
    }

    tooltipMouseRef.current = { x: e.clientX, y: e.clientY };
    positionTooltip(e.clientX, e.clientY);

    const key = `${hot}||${cold}`;
    hoverKeyRef.current = key;
    setTooltipCell({ hot, cold });
    setTooltipError("");

    const cached = detailCacheRef.current.get(key);
    if (cached) {
      setTooltipMatrix(cached);
      setTooltipLoading(false);
      return;
    }

    setTooltipMatrix(null);
    setTooltipLoading(true);
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(async () => {
      try {
        const data = await fetchDetailMatrix(hot, cold);
        if (hoverKeyRef.current !== key) return;
        setTooltipMatrix(data);
        setTooltipLoading(false);
      } catch (err: any) {
        if (hoverKeyRef.current !== key) return;
        setTooltipError(String(err));
        setTooltipLoading(false);
      }
    }, 240);
  }

  function positionTooltip(clientX: number, clientY: number) {
    const rect = tooltipRef.current?.getBoundingClientRect();
    const tooltipWidth = rect?.width ?? 260;
    const tooltipHeight = rect?.height ?? 200;
    let x = clientX + 12;
    let y = clientY + 12;
    const maxX = Math.max(8, window.innerWidth - tooltipWidth - 8);
    const maxY = Math.max(8, window.innerHeight - tooltipHeight - 8);
    if (x > maxX) x = maxX;
    if (x < 8) x = 8;
    if (y > maxY) y = maxY;
    if (y < 8) y = 8;
    setTooltipPos({ x, y });
  }

  function handleCellLeave() {
    setHoverCell(null);
    setTooltipCell(null);
    setTooltipLoading(false);
    setTooltipError("");
    setTooltipMatrix(null);
    hoverKeyRef.current = null;
    tooltipMouseRef.current = null;
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }

  function handleCellClick(hot: string, cold: string) {
    const isSame = selectedCell && selectedCell.hot === hot && selectedCell.cold === cold;
    if (isSame) {
      setSelectedCell(null);
      setDetailOpen(false);
      setDetailMatrix(null);
      return;
    }
    setSelectedCell({ hot, cold });
    setTooltipCell(null);
    setTooltipMatrix(null);
    setTooltipLoading(false);
    setTooltipError("");
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    openDetail(hot, cold);
  }

  async function fetchDetailMatrix(hot: string, cold: string): Promise<DetailMatrix> {
    const key = `${hot}||${cold}`;
    const cached = detailCacheRef.current.get(key);
    if (cached) return cached;
    const r = await fetch(`/api/results/match?hot=${encodeURIComponent(hot)}&cold=${encodeURIComponent(cold)}`);
    const body = await readJsonOrText(r);
    if (!r.ok || !body || typeof body !== "object" || !(body as any).ok) {
      const msg = (body as any)?.error?.message ?? "Failed to load detail matrix.";
      throw new Error(String(msg));
    }
    const rows = Array.isArray((body as any).rows) ? (body as any).rows.map((x: any) => String(x)) : [];
    const cols = Array.isArray((body as any).cols) ? (body as any).cols.map((x: any) => String(x)) : [];
    const q = Array.isArray((body as any).q) ? (body as any).q.map((row: any) => (Array.isArray(row) ? row.map((v: any) => Number(v)) : [])) : [];
    const data = {
      hot: String((body as any).hot ?? hot),
      cold: String((body as any).cold ?? cold),
      rows,
      cols,
      q,
    };
    detailCacheRef.current.set(key, data);
    return data;
  }

  async function fetchStreamDetail(name: string, unit: StreamUnit): Promise<StreamDetail> {
    const key = `${name}||${unit}`;
    const cached = streamDetailCacheRef.current.get(key);
    if (cached) return cached;
    const r = await fetch(`/api/results/stream?name=${encodeURIComponent(name)}&unit=${encodeURIComponent(unit)}`);
    const body = await readJsonOrText(r);
    if (!r.ok || !body || typeof body !== "object" || !(body as any).ok) {
      const msg = (body as any)?.error?.message ?? "Failed to load stream detail.";
      throw new Error(String(msg));
    }
    const q_str = Array.isArray((body as any).q_str) ? (body as any).q_str.map((x: any) => String(x)) : [];
    const describes = Array.isArray((body as any).describes) ? (body as any).describes.map((x: any) => String(x)) : [];
    const t_upper = Array.isArray((body as any).t_upper) ? (body as any).t_upper.map((x: any) => Number(x)) : [];
    const t_lower = Array.isArray((body as any).t_lower) ? (body as any).t_lower.map((x: any) => Number(x)) : [];
    const unitLabel = String((body as any).unit ?? unit);
    const data = { name: String((body as any).name ?? name), unit: unitLabel, q_str, describes, t_upper, t_lower };
    streamDetailCacheRef.current.set(key, data);
    return data;
  }

  async function openDetail(hot: string, cold: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailMatrix(null);
    setStreamDetailOpen(false);
    try {
      const data = await fetchDetailMatrix(hot, cold);
      setDetailMatrix(data);
      setDetailLoading(false);
    } catch (e: any) {
      setDetailError(String(e));
      setDetailLoading(false);
    }
  }

  async function openStreamDetail(name: string, unit: StreamUnit = streamDetailUnit) {
    setStreamDetailOpen(true);
    setStreamDetailLoading(true);
    setStreamDetailError("");
    setStreamDetail(null);
    setStreamDetailName(name);
    setStreamDetailUnit(unit);
    setDetailOpen(false);
    try {
      const data = await fetchStreamDetail(name, unit);
      setStreamDetail(data);
      setStreamDetailLoading(false);
    } catch (e: any) {
      setStreamDetailError(String(e));
      setStreamDetailLoading(false);
    }
  }


  useEffect(() => {
    const nextClass = theme === "dark" ? "theme-dark" : "theme-light";
    document.body.classList.remove("theme-light", "theme-dark");
    document.body.classList.add(nextClass);
    window.localStorage.setItem("ei-theme", theme);
  }, [theme]);

  useEffect(() => {
    setHenReady(false);
    setResultsReady(false);
    setResultHotOrder([]);
    setResultColdOrder([]);
    setResultEdges([]);
    setResultObjValue(null);
    setSolutionReport(null);
    setEconomicReport(null);
    setHoverCell(null);
    setSelectedCell(null);
    setDetailOpen(false);
    setDetailLoading(false);
    setDetailError("");
    setDetailMatrix(null);
    setStreamDetailOpen(false);
    setStreamDetailLoading(false);
    setStreamDetailError("");
    setStreamDetail(null);
    setStreamDetailName(null);
    setTooltipCell(null);
    setTooltipLoading(false);
    setTooltipError("");
    setTooltipMatrix(null);
    detailCacheRef.current.clear();
    streamDetailCacheRef.current.clear();
  }, [streams, intervalsConfig]);

  useEffect(() => {
    fetch("/api/console").catch(() => { });
  }, []);

  useEffect(() => {
    if (step !== "solve") return;
    if (consoleEsRef.current) return;

    const consoleStreamUrl = "/api/console/stream";
    setConsoleConnected(false);
    const es = new EventSource(consoleStreamUrl);
    consoleEsRef.current = es;

    es.onopen = () => setConsoleConnected(true);
    es.onerror = () => {
      setConsoleConnected(false);
      es.close();
      if (consoleEsRef.current === es) consoleEsRef.current = null;
    };
    es.onmessage = (e) => {
      const line = typeof e.data === "string" ? e.data : String(e.data ?? "");
      setConsoleConnected(true);
      setConsoleLines((prev) => {
        const next = [...prev, line];
        return next.length > 2000 ? next.slice(next.length - 2000) : next;
      });
    };
  }, [step]);

  useEffect(() => {
    return () => {
      consoleEsRef.current?.close();
      consoleEsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (step !== "solve") return;
    const el = consoleBoxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [consoleLines, step]);

  useEffect(() => {
    if (!tooltipCell || !tooltipMouseRef.current) return;
    positionTooltip(tooltipMouseRef.current.x, tooltipMouseRef.current.y);
  }, [tooltipCell, tooltipMatrix, tooltipLoading, tooltipError]);

  async function buildHEN() {
    setUiMsg("");
    setBackendResp(null);
    setHenPlot(null);
    setHenReady(false);
    const payload = buildPayloadSI(streams, intervalsConfig);

    try {
      const r = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await readJsonOrText(r);
      setBackendResp(toBackendResp(r, body));
      const fig = (body as any)?.plot;
      if (r.ok && typeof body === "object" && body && (body as any).ok && fig && typeof fig === "object") {
        setHenPlot(fig as PlotlyFigurePayload);
        setHenReady(true);
        setStep("build");
      }
    } catch (e: any) {
      setBackendResp({ status: 0, ok: false, body: { message: "Request failed", error: String(e) } });
    }
  }

  function solveMILP() {
    setUiMsg("");
    setBackendResp(null);

    if (!henReady) {
      setUiMsg("Build HEN first.");
      return;
    }

    fetch("/api/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (r) => {
        const body = await readJsonOrText(r);
        setBackendResp(toBackendResp(r, body));
        if (r.ok && body && typeof body === "object" && (body as any).ok) {
          setUiMsg("Solve completed.");
          detailCacheRef.current.clear();
          streamDetailCacheRef.current.clear();
          const hot = Array.isArray((body as any).hot_names) ? (body as any).hot_names.map((x: any) => String(x)) : [];
          const cold = Array.isArray((body as any).cold_names) ? (body as any).cold_names.map((x: any) => String(x)) : [];
          const edgesRaw = Array.isArray((body as any).edges) ? (body as any).edges : [];
          const edges: ResultEdge[] = edgesRaw
            .map((x: any) => ({
              hot: String(x?.hot ?? ""),
              cold: String(x?.cold ?? ""),
              q_total: Number(x?.q_total ?? 0),
            }))
            .filter((x: ResultEdge) => x.hot && x.cold);

          setResultHotOrder(hot);
          setResultColdOrder(cold);
          setResultEdges(edges);
          setResultObjValue(Number((body as any).obj_value ?? NaN));
          const reportRaw = (body as any).solution_report;
          setSolutionReport(reportRaw && typeof reportRaw === "object" ? (reportRaw as SolutionReport) : null);
          const econRaw = (body as any).economic_report;
          if (econRaw && typeof econRaw === "object") {
            const column_labels = Array.isArray((econRaw as any).column_labels)
              ? (econRaw as any).column_labels.map((x: any) => String(x))
              : [];
            const row_labels = Array.isArray((econRaw as any).row_labels)
              ? (econRaw as any).row_labels.map((x: any) => String(x))
              : [];
            const data = Array.isArray((econRaw as any).data)
              ? (econRaw as any).data.map((row: any) => (Array.isArray(row) ? row.map((v: any) => String(v)) : []))
              : [];
            setEconomicReport({ column_labels, row_labels, data });
          } else {
            setEconomicReport(null);
          }
          setResultsReady(true);
          setStep("results");
        }
      })
      .catch((e: any) => {
        setBackendResp({ status: 0, ok: false, body: { message: "Request failed", error: String(e) } });
      });
  }

  async function saveStreamset() {
    setUiMsg("");
    setBackendResp(null);

    const defaultName = `streamset-${new Date().toISOString()}`;
    const name = window.prompt("Name for saved streamset:", defaultName);
    if (!name) return;

    try {
      const r = await fetch("/api/streamsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema_version: "ei-stream-ui-v1", name, streams, intervals_config: intervalsConfig }),
      });

      const body = await readJsonOrText(r);
      setBackendResp(toBackendResp(r, body));
      if (r.ok && body && typeof body === "object" && "id" in body) {
        setLastStreamsetId(String((body as any).id));
      }
    } catch (e: any) {
      setBackendResp({ status: 0, ok: false, body: { message: "Request failed", error: String(e) } });
    }
  }

  function loadStreamset() {
    streamsetFileRef.current?.click();
  }

  async function handleStreamsetFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    const ok = window.confirm("Load streamset and replace current streams?");
    if (!ok) return;

    setUiMsg("");
    setBackendResp(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const loaded = (data as any)?.streams;
      const loadedCfg = (data as any)?.intervals_config;
      if (Array.isArray(loaded)) {
        setStreams(loaded as StreamRowUI[]);
        setIntervalsConfig(normalizeIntervalsConfigUI(loadedCfg));
        const relativePath = "webkitRelativePath" in file ? file.webkitRelativePath : "";
        const label = relativePath ? relativePath : file.name;
        setLastStreamsetFileName(label);
        window.localStorage.setItem("ei-last-streamset-file", label);
        setUiMsg(`Loaded streamset ${label}.`);
      } else {
        setUiMsg("Invalid streamset file.");
      }
    } catch (e: any) {
      setUiMsg(`Load failed: ${String(e)}`);
    }
  }

  const buttonTone = "tone-button";
  const themeIcon = theme === "dark" ? "🌙" : "☀️";
  const fieldTone = "border-neutral-300 bg-white text-neutral-900 placeholder:text-gray-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600";
  const panelSurface = "bg-white text-neutral-900 dark:bg-neutral-950/60 dark:text-neutral-100";
  const panelTone = `tone-panel ${panelSurface}`;
  const sidebarTone = "tone-sidebar";
  const stepItemTone = (active: boolean) => active ? "tone-step tone-step-active" : "tone-step";

  const steps: { key: AppStep; title: string; desc: string }[] = [
    { key: "streams", title: "Streams", desc: "Edit inputs" },
    { key: "build", title: "Build", desc: "Inspect HEN" },
    { key: "solve", title: "Solve", desc: "Run MILP" },
    { key: "results", title: "Results", desc: "View matrix" },
  ];

  return (
    <div className="h-screen w-screen flex" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}>
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} shrink-0 border-r overflow-hidden transition-all ${sidebarTone}`}
      >
        <div className="h-full flex flex-col p-3 gap-3">
          <div className={sidebarOpen ? "flex items-center justify-between" : "flex items-center justify-center"}>
            {sidebarOpen ? (
              <div className="font-bold leading-tight min-w-0">
                <div className="text-lg">EnergyIntegration</div>
                <div className="text-gray-500 text-xs dark:text-neutral-400">WebApp</div>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              {sidebarOpen ? (
                <button
                  className={`w-10 h-10 flex items-center justify-center border rounded transition-colors ${buttonTone}`}
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                  aria-label="Toggle theme"
                >
                  <span className="text-lg">{themeIcon}</span>
                </button>
              ) : null}
              <button
                className={`w-10 h-10 flex items-center justify-center border rounded transition-colors ${buttonTone}`}
                onClick={() => setSidebarOpen((v) => !v)}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                aria-label="Toggle sidebar"
              >
                <span className="text-lg">{sidebarOpen ? "<" : ">"}</span>
              </button>
            </div>
          </div>

          <nav className="space-y-1">
            {steps.map((s, idx) => {
              const active = step === s.key;
              const locked = s.key === "results" && !resultsReady;
              return (
                <button
                  key={s.key}
                  type="button"
                  className={`w-full flex items-center ${sidebarOpen ? "gap-3 justify-start px-3" : "justify-center px-2"} text-left border rounded py-2 transition-colors ${stepItemTone(active)} ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => !locked && setStep(s.key)}
                  disabled={locked}
                  title={locked ? "Run solve first." : s.title}
                >
                  <div
                    className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-semibold ${active
                      ? "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-950"
                      : "border-neutral-200 dark:border-neutral-800"
                      }`}
                  >
                    {idx + 1}
                  </div>
                  {sidebarOpen ? (
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">{s.title}</div>
                      <div className="text-gray-500 text-xs truncate dark:text-neutral-400">
                        {s.desc}
                      </div>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className={`mt-auto flex items-center ${sidebarOpen ? "gap-2" : "flex-col gap-2"}`}>
            <button
              className={`w-10 h-10 flex items-center justify-center border rounded transition-colors ${buttonTone}`}
              onClick={saveStreamset}
              title="Save streamset"
              aria-label="Save streamset"
            >
              <span className="text-lg">⤓</span>
            </button>
            <button
              className={`w-10 h-10 flex items-center justify-center border rounded transition-colors ${buttonTone}`}
              onClick={loadStreamset}
              title="Load streamset"
              aria-label="Load streamset"
            >
              <span className="text-lg">⤒</span>
            </button>
            {sidebarOpen ? (
              <div className="text-gray-500 text-xs dark:text-neutral-400">
                {lastStreamsetFileName ? `Last: ${lastStreamsetFileName}` : lastStreamsetId ? `Last: ${lastStreamsetId}` : "No load yet"}
              </div>
            ) : null}
            <input
              ref={streamsetFileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleStreamsetFileChange}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto p-4">
        {step === "streams" ? (
          <StreamsStep
            streams={streams}
            issues={issues}
            hasError={hasError}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            intervalsOpen={intervalsOpen}
            setIntervalsOpen={setIntervalsOpen}
            intervalsConfig={intervalsConfig}
            setIntervalsConfig={setIntervalsConfig}
            onResetIntervals={() => setIntervalsConfig(defaultIntervalsConfigUI())}
            onAddStream={addStream}
            onBuildHEN={buildHEN}
            onUpdateStream={updateStream}
            onDeleteStream={deleteStream}
            onDuplicateStream={duplicateStream}
            theme={theme}
            buttonTone={buttonTone}
            panelTone={panelTone}
            fieldTone={fieldTone}
          />
        ) : step === "build" ? (
          <BuildStep
            hasError={hasError}
            onBuildHEN={buildHEN}
            buttonTone={buttonTone}
            panelTone={panelTone}
            henPlot={henPlot}
            theme={theme}
          />
        ) : step === "solve" ? (
          <SolveStep
            henReady={henReady}
            onSolve={solveMILP}
            buttonTone={buttonTone}
            panelTone={panelTone}
            fieldTone={fieldTone}
            optOpen={optOpen}
            setOptOpen={setOptOpen}
            optConfig={optConfig}
            setOptConfig={setOptConfig}
            consoleConnected={consoleConnected}
            consoleLines={consoleLines}
            consoleBoxRef={consoleBoxRef}
          />
        ) : (
          <ResultsStep
            resultsReady={resultsReady}
            panelTone={panelTone}
            resultHotOrder={resultHotOrder}
            resultColdOrder={resultColdOrder}
            resultEdges={resultEdges}
            resultObjValue={resultObjValue}
            solutionReport={solutionReport}
            economicReport={economicReport}
            hoverCell={hoverCell}
            selectedCell={selectedCell}
            reorderPulse={reorderPulse}
            streamDetailUnit={streamDetailUnit}
            tooltipCell={tooltipCell}
            tooltipPos={tooltipPos}
            tooltipLoading={tooltipLoading}
            tooltipError={tooltipError}
            tooltipMatrix={tooltipMatrix}
            tooltipRef={tooltipRef}
            lastHeaderDragAtRef={lastHeaderDragAtRef}
            onCellLeave={handleCellLeave}
            onHeaderDragStart={handleHeaderDragStart}
            onHeaderDragEnd={handleHeaderDragEnd}
            onHeaderDrop={handleHeaderDrop}
            onStreamDetail={openStreamDetail}
            onCellEnter={handleCellEnter}
            onCellClick={handleCellClick}
          />
        )}
        {step === "streams" && (uiMsg || backendResp) ? (
          <div className={`border rounded p-3 mt-4 ${panelTone}`}>
            <div className="font-semibold mb-1">Status</div>
            {uiMsg ? <div className="text-sm mb-2">{uiMsg}</div> : null}
            {backendResp ? (
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(backendResp, (k, v) => (k === "plot" ? "[omitted]" : v), 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </main>

      {detailOpen ? (
        <div
          className="matrix-detail-overlay"
          style={{ left: sidebarOpen ? "16rem" : "4rem" }}
        >
          <div className="matrix-detail-panel">
            <div className="flex items-center gap-3 mb-3">
              <button
                className={`px-3 py-1.5 border rounded transition-colors ${buttonTone}`}
                type="button"
                onClick={() => {
                  setDetailOpen(false);
                  setSelectedCell(null);
                  setDetailMatrix(null);
                }}
              >
                Back
              </button>
              <div className="font-semibold text-lg">Match detail</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
              {detailMatrix ? `Hot: ${detailMatrix.hot}  |  Cold: ${detailMatrix.cold}` : "Loading..."}
            </div>

            {detailLoading ? (
              <div className="text-sm text-gray-500 dark:text-neutral-400">Loading detail matrix...</div>
            ) : detailError ? (
              <div className="text-sm text-red-600 dark:text-red-400">{detailError}</div>
            ) : detailMatrix ? (
              <div className="overflow-auto max-h-[75vh]">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40"></th>
                      {detailMatrix.cols.map((c) => (
                        <th
                          key={c}
                          className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 whitespace-nowrap"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailMatrix.rows.map((r, i) => (
                      <tr key={r}>
                        <th className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 whitespace-nowrap">
                          {r}
                        </th>
                        {detailMatrix.cols.map((c, j) => {
                          const v = detailMatrix.q?.[i]?.[j] ?? 0;
                          return (
                            <td
                              key={`${r}||${c}`}
                              className="px-2 py-1 border border-gray-200 dark:border-neutral-800 text-right tabular-nums min-w-[72px]"
                              title={String(v)}
                            >
                              {formatHeat(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {streamDetailOpen ? (
        <div
          className="matrix-detail-overlay"
          style={{ left: sidebarOpen ? "16rem" : "4rem" }}
        >
          <div className="matrix-detail-panel">
            <div className="flex items-center gap-3 mb-3">
              <button
                className={`px-3 py-1.5 border rounded transition-colors ${buttonTone}`}
                type="button"
                onClick={() => {
                  setStreamDetailOpen(false);
                  setStreamDetail(null);
                  setStreamDetailName(null);
                }}
              >
                Back
              </button>
              <div className="font-semibold text-lg">Stream detail</div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-neutral-400 mb-4">
              <div>
                <span className="font-semibold text-gray-700 dark:text-neutral-300">Stream:</span>{" "}
                {streamDetail?.name ?? streamDetailName ?? "-"}
              </div>
              <label className="flex items-center gap-2">
                <span className="font-semibold text-gray-700 dark:text-neutral-300">Unit:</span>
                <select
                  className={`h-7 border rounded px-2 text-xs ${fieldTone}`}
                  value={streamDetailUnit}
                  onChange={(e) => {
                    const nextUnit = e.target.value as StreamUnit;
                    const name = streamDetail?.name ?? streamDetailName;
                    if (name) openStreamDetail(name, nextUnit);
                  }}
                >
                  {STREAM_UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </label>
            </div>

            {streamDetailLoading ? (
              <div className="text-sm text-gray-500 dark:text-neutral-400">Loading stream detail...</div>
            ) : streamDetailError ? (
              <div className="text-sm text-red-600 dark:text-red-400">{streamDetailError}</div>
            ) : streamDetail ? (
              <div className="overflow-auto max-h-[75vh]">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">k</th>
                      <th className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">{streamDetail.name}</th>
                      <th className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">Heat exchange object</th>
                      <th className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">T_upper</th>
                      <th className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40">T_lower</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streamDetail.q_str.map((q, i) => (
                      <tr key={i}>
                        <td className="text-center px-2 py-1 border border-gray-200 dark:border-neutral-800 tabular-nums">{i + 1}</td>
                        <td className="text-right px-2 py-1 border border-gray-200 dark:border-neutral-800 tabular-nums">{q}</td>
                        <td className="text-left px-2 py-1 border border-gray-200 dark:border-neutral-800">{streamDetail.describes[i] ?? ""}</td>
                        <td className="text-right px-2 py-1 border border-gray-200 dark:border-neutral-800 tabular-nums">{formatHeat(streamDetail.t_upper[i] ?? 0)}</td>
                        <td className="text-right px-2 py-1 border border-gray-200 dark:border-neutral-800 tabular-nums">{formatHeat(streamDetail.t_lower[i] ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
