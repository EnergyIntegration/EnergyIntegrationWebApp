import type { PlotlyFigurePayload } from "../../types/plotly";
import type { Theme } from "../../types/theme";
import { PlotlyFigure } from "../PlotlyFigure";
import { Panel } from "../ui/Panel";

type BuildStepProps = {
  hasError: boolean;
  onBuildHEN: () => void;
  buttonTone: string;
  panelTone: string;
  henPlot: PlotlyFigurePayload | null;
  theme: Theme;
};

export function BuildStep({
  hasError,
  onBuildHEN,
  buttonTone,
  panelTone,
  henPlot,
  theme,
}: BuildStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="text-xl font-bold">Build / Inspect</div>
        <button
          className={`px-3 py-1.5 border rounded transition-colors ml-auto ${buttonTone} tone-button-primary ${hasError ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={onBuildHEN}
          disabled={hasError}
          title={hasError ? "Fix errors before building." : "Build HEN"}
        >
          Rebuild
        </button>
      </div>

      <Panel className={panelTone}>
        <div className="font-semibold mb-2">HEN summary</div>
        <div className="text-gray-600 text-sm dark:text-neutral-400">
          This tab will show pinch, grid, buckets, and problem table stats.
        </div>
      </Panel>

      {henPlot ? (
        <Panel className={panelTone}>
          <div className="font-semibold mb-2">Composite curve</div>
          <div className="w-full overflow-hidden">
            <PlotlyFigure fig={henPlot} theme={theme} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
