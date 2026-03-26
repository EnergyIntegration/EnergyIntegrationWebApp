import type { ReactNode } from "react";
import styles from "./Figure.module.css";

type FigureKind = "figure" | "table";

type FigureProps = {
  id?: string;
  caption: string;
  number?: string;
  label?: string;
  kind?: FigureKind;
  children: ReactNode;
};

export default function Figure({
  id,
  caption,
  number,
  label,
  kind = "figure",
  children,
}: FigureProps) {
  const resolvedLabel = label ?? (kind === "table" ? "Table" : "Figure");

  return (
    <figure id={id} className={styles.figure} data-kind={kind}>
      <div className={styles.body}>{children}</div>
      <figcaption className={styles.caption}>
        <span className={styles.captionLabel}>
          {resolvedLabel}
          {number ? ` ${number}` : ""}
          .
        </span>{" "}
        {caption}
      </figcaption>
    </figure>
  );
}
