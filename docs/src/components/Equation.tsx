import katex from "katex";
import styles from "./Equation.module.css";

type EquationProps = {
  id?: string;
  formula: string;
  number?: string;
};

export default function Equation({ id, formula, number }: EquationProps) {
  const html = katex.renderToString(formula, {
    displayMode: true,
    throwOnError: false,
  });

  return (
    <div id={id} className={styles.equation}>
      <div
        className={styles.body}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <span className={styles.number}>{number ? `(${number})` : ""}</span>
    </div>
  );
}
