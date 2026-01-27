import type { ReactNode } from "react";
import type { PricingBasis, ScalarSpecUI, StreamRowUI, UnitNumberUI } from "../types/stream";
import type { Theme } from "../types/theme";
import { ScalarSpecInline } from "./ScalarSpecInline";

const pricingBasisOptions: PricingBasis[] = ["Energy", "Power"];
const cpUnits = ["J/(mol⋅K)", "kJ/(mol⋅K)", "MJ/(mol⋅K)"];
const hvapUnits = ["J/mol", "kJ/mol", "MJ/mol"];
const htcUnits = ["W/(m²⋅K)", "kW/(m²⋅K)"];
const dTUnits = ["K", "°C"];
const pressureUnits = ["bar", "kPa", "MPa", "Pa"];

function unitNumberInline(
  label: ReactNode,
  u: UnitNumberUI,
  unitOptions: string[],
  onChange: (next: UnitNumberUI) => void,
  disabled: boolean,
  theme: Theme,
  keepSpin: boolean = false,
  unitWidthClassName: string = "w-[140px]"
) {
  const fieldTone = "border-neutral-300 bg-white text-neutral-900 placeholder:text-gray-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600";
  const spec: ScalarSpecUI = { mode: "fixed", unit: u.unit, value: u.value, lo: "", hi: "" };

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      <ScalarSpecInline
        spec={spec}
        unitOptions={unitOptions}
        onChange={(next) => onChange({ value: next.value, unit: next.unit })}
        theme={theme}
        enabledToneClassName={fieldTone}
        disabled={disabled}
        keepSpin={keepSpin}
        showModeToggle={false}
        unitWidthClassName={unitWidthClassName}
      />
    </div>
  );
}

export function StreamDetail(props: {
  stream: StreamRowUI | null;
  onChange: (next: StreamRowUI) => void;
  theme: Theme;
}) {
  const { stream, onChange, theme } = props;

  if (!stream) {
    return (
      <div className="border rounded p-4 border-neutral-200 bg-white text-gray-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
        Select a stream to edit details.
      </div>
    );
  }

  const isIso = stream.kind === "IsothermalFixed" || stream.kind === "IsothermalVariable";
  const isMVR = stream.kind === "MVR";
  const mutedText = "text-gray-600 dark:text-neutral-400";
  const cardTone = "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950/40";
  const fieldTone = "border-neutral-300 bg-white text-neutral-900 placeholder:text-gray-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600";

  return (
    <div className={`border rounded p-4 space-y-6 ${cardTone}`}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Stream detail</div>
        <div className={`text-sm ${mutedText}`}>
          {stream.thermal} / {stream.kind}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Pressure & composition */}
          <section className="space-y-3">
            <div className="font-semibold">Pressure & composition</div>

            <div className="space-y-1">
              <div className="text-sm font-medium">P<sub>in</sub></div>
              <ScalarSpecInline
                spec={stream.Pin}
                unitOptions={pressureUnits}
                onChange={(spec) => onChange({ ...stream, Pin: spec })}
                theme={theme}
                enabledToneClassName={fieldTone}
                disabled={!isMVR}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">P<sub>out</sub></div>
              <ScalarSpecInline
                spec={stream.Pout}
                unitOptions={pressureUnits}
                onChange={(spec) => onChange({ ...stream, Pout: spec })}
                theme={theme}
                enabledToneClassName={fieldTone}
                disabled={!isMVR}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">frac (comma-separated)</div>
              <input
                className={`w-full border rounded px-2 py-1 ${fieldTone}`}
                value={stream.fracText}
                onChange={(e) => onChange({ ...stream, fracText: e.target.value })}
                placeholder="0.5,0.5"
              />
            </div>
          </section>

          {/* Thermophysical (up to Tcont) */}
          <section className="space-y-3">
            <div className="font-semibold">Thermophysical</div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">H model</div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={stream.useAdvancedHcoeff}
                  onChange={(e) => onChange({ ...stream, useAdvancedHcoeff: e.target.checked })}
                />
                advanced Hcoeff6
              </label>
            </div>

            {!stream.useAdvancedHcoeff ? (
              unitNumberInline(
                "Cp (used as Hcoeff=(0,Cp,0,0,0,0))",
                stream.Cp,
                cpUnits,
                (u) => onChange({ ...stream, Cp: u }),
                false,
                theme
              )
            ) : (
              <div className="space-y-2">
                <div className={`text-sm ${mutedText}`}>Hcoeff6 (SI assumed). a1 is typically Cp.</div>
                <div className="grid grid-cols-3 gap-2">
                  {stream.Hcoeff6.map((v, i) => (
                    <input
                      key={i}
                      className={`no-spin border rounded px-2 py-1 ${fieldTone}`}
                      type="number"
                      value={v}
                      onChange={(e) => {
                        const next = [...stream.Hcoeff6];
                        next[i] = e.target.value;
                        onChange({ ...stream, Hcoeff6: next });
                      }}
                      placeholder={`a${i}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {isIso ? (
              unitNumberInline("Hvap", stream.Hvap, hvapUnits, (u) => onChange({ ...stream, Hvap: u }), false, theme)
            ) : (
              <div className={`text-sm ${mutedText}`}>Hvap is used for isothermal streams only.</div>
            )}

            {unitNumberInline("HTC", stream.HTC, htcUnits, (u) => onChange({ ...stream, HTC: u }), false, theme)}
          </section>
        </div>

        <div className="space-y-6">
          {/* Special */}
          <section className="space-y-3">
            <div className="font-semibold">Special</div>
            {unitNumberInline("Tcont (ΔT)", stream.Tcont, dTUnits, (u) => onChange({ ...stream, Tcont: u }), false, theme, true)}
            {unitNumberInline("min_TD (ΔT)", stream.min_TD, dTUnits, (u) => onChange({ ...stream, min_TD: u }), false, theme, true)}
            {unitNumberInline("superheating_deg (ΔT)", stream.superheating_deg, dTUnits, (u) => onChange({ ...stream, superheating_deg: u }), false, theme, true)}
            {unitNumberInline("subcooling_deg (ΔT)", stream.subcooling_deg, dTUnits, (u) => onChange({ ...stream, subcooling_deg: u }), false, theme, true)}
          </section>

          {/* Cost & pricing */}
          <section className="space-y-3">
            <div className="font-semibold">Cost & pricing</div>
            {unitNumberInline("cost (numeric; backend interprets)", stream.cost, ["-"], (u) => onChange({ ...stream, cost: u }), false, theme, false, "w-[90px]")}
            <div className="grid grid-cols-[1fr_180px] gap-2 items-end">
              <div className="text-sm font-medium">pricing_basis</div>
              <select
                className={`border rounded px-2 py-1 ${fieldTone}`}
                value={stream.pricing_basis}
                onChange={(e) => onChange({ ...stream, pricing_basis: e.target.value as PricingBasis })}
              >
                {pricingBasisOptions.map((x) => <option value={x} key={x}>{x}</option>)}
              </select>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
