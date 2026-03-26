import styles from "./StreamEditorMock.module.css";

type SummaryCellProps = {
  value: string;
  unit?: string;
  mode?: string;
};

function SummaryScalar({ value, unit, mode = "fixed" }: SummaryCellProps) {
  return (
    <div className={styles.scalar}>
      <div className={styles.modeBox}>{mode === "fixed" ? "≡" : "↔"}</div>
      <div className={styles.valueBox}>{value}</div>
      <div className={styles.unitBox}>
        <span>{unit}</span>
        <span className={styles.caret}>▾</span>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  unit?: string;
  mode?: string;
  checkboxLabel?: string;
  hint?: string;
};

function DetailField({ label, value, unit, mode = "fixed", checkboxLabel, hint }: FieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <div className={styles.fieldLabel}>{label}</div>
        {checkboxLabel ? (
          <label className={styles.checkboxRow}>
            <span className={styles.checkbox}></span>
            <span>{checkboxLabel}</span>
          </label>
        ) : null}
      </div>
      <div className={styles.scalar}>
        <div className={styles.modeBox}>{mode === "fixed" ? "≡" : "↔"}</div>
        <div className={styles.valueBox}>{value}</div>
        {unit ? (
          <div className={styles.unitBox}>
            <span>{unit}</span>
            <span className={styles.caret}>▾</span>
          </div>
        ) : null}
      </div>
      {hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
}

export default function StreamEditorMock() {
  return (
    <article className={styles.panel}>
      <section className={styles.summaryPanel}>
        <div className={styles.summaryHeader}>
          <div></div>
          <div>Name</div>
          <div>Type</div>
          <div>Kind</div>
          <div>F</div>
          <div>
            T<sub>in</sub>
          </div>
          <div>
            T<sub>out</sub>
          </div>
          <div></div>
        </div>

        <div className={styles.summaryRow}>
          <div className={styles.iconButton}>▾</div>
          <div className={styles.valueBox}>h1</div>
          <div className={styles.unitBox}>
            <span>hot</span>
            <span className={styles.caret}>▾</span>
          </div>
          <div className={styles.unitBox}>
            <span>Common</span>
            <span className={styles.caret}>▾</span>
          </div>
          <SummaryScalar value="value" unit="mol/s" />
          <SummaryScalar value="value" unit="°C" />
          <SummaryScalar value="value" unit="°C" />
          <div className={styles.actionGroup}>
            <div className={styles.iconButton}>⧉</div>
            <div className={styles.iconButton}>×</div>
          </div>
        </div>
      </section>

      <section className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailTitle}>Stream detail</div>
          <div className={styles.detailMeta}>hot / Common</div>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.column}>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Pressure &amp; composition</div>
              <DetailField label="P_in" value="value" unit="bar" />
              <DetailField label="P_out" value="value" unit="bar" />
              <div className={styles.field}>
                <div className={styles.fieldLabel}>frac (comma-separated)</div>
                <div className={styles.textBox}>0.5,0.5</div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Thermophysical</div>
              <DetailField
                label="H model"
                value="value"
                unit="J/(mol·K)"
                checkboxLabel="advanced Hcoeff6"
              />
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Cp (molar heat capacity at constant pressure)</div>
                <div className={styles.scalarCompact}>
                  <div className={styles.valueBox}>value</div>
                  <div className={styles.unitBox}>
                    <span>J/(mol·K)</span>
                    <span className={styles.caret}>▾</span>
                  </div>
                </div>
                <div className={styles.hint}>Hvap is used for isothermal streams only.</div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>HTC (heat transfer coefficient)</div>
                <div className={styles.scalarCompact}>
                  <div className={styles.valueBox}>value</div>
                  <div className={styles.unitBox}>
                    <span>W/(m²·K)</span>
                    <span className={styles.caret}>▾</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className={styles.column}>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>Special</div>
              <DetailField label="Tcont (ΔT)" value="value" unit="K" />
              <DetailField label="min_TD (ΔT)" value="0" unit="K" />
              <DetailField label="superheating_deg (ΔT)" value="0" unit="K" />
              <DetailField label="subcooling_deg (ΔT)" value="0" unit="K" />
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>Cost &amp; pricing</div>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>cost (numeric; backend interprets)</div>
                <div className={styles.scalarCompact}>
                  <div className={styles.valueBox}>0</div>
                  <div className={styles.unitBox}>
                    <span>-</span>
                    <span className={styles.caret}>▾</span>
                  </div>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>pricing_basis</div>
                <div className={styles.unitBox}>
                  <span>Energy</span>
                  <span className={styles.caret}>▾</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </article>
  );
}
