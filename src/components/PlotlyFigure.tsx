import type * as PlotlyJS from "plotly.js";
// @ts-expect-error plotly.js-dist-min does not ship TypeScript declarations
import * as PlotlyDist from "plotly.js-dist-min";
import { useEffect, useRef } from "react";
import type { PlotlyFigurePayload } from "../types/plotly";
import type { Theme } from "../types/theme";

export function PlotlyFigure(props: { fig: PlotlyFigurePayload; theme: Theme }) {
  const { fig, theme } = props;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const Plotly = PlotlyDist as unknown as typeof PlotlyJS;
    const data = Array.isArray(fig.data) ? fig.data : [];
    const layout: Record<string, any> = { ...(fig.layout ?? {}) };
    const config: Record<string, any> = { responsive: true, displaylogo: false, ...(fig.config ?? {}) };

    const fg = theme === "dark" ? "#e5e5e5" : "#111827";
    const grid = theme === "dark" ? "#404040" : "#e5e7eb";

    layout.paper_bgcolor = "rgba(0,0,0,0)";
    layout.plot_bgcolor = "rgba(0,0,0,0)";
    layout.font = { ...(layout.font ?? {}), color: fg };
    layout.xaxis = { ...(layout.xaxis ?? {}), gridcolor: grid, zerolinecolor: grid };
    layout.yaxis = { ...(layout.yaxis ?? {}), gridcolor: grid, zerolinecolor: grid };
    layout.xaxis2 = { ...(layout.xaxis2 ?? {}), gridcolor: grid, zerolinecolor: grid };
    layout.yaxis2 = { ...(layout.yaxis2 ?? {}), gridcolor: grid, zerolinecolor: grid };

    Plotly.react(el, data, layout, config);
    return () => {
      Plotly.purge(el);
    };
  }, [fig, theme]);

  return <div ref={ref} className="w-full" style={{ minHeight: 420 }} />;
}
