import CodeBlock from "@theme/CodeBlock";
import type { ReactNode } from "react";
import styles from "./FunctionDoc.module.css";

export type FunctionParameter = {
  name: string;
  type?: string;
  description: ReactNode;
  defaultValue?: string;
};

export type FunctionReturn = {
  type?: string;
  description: ReactNode;
};

type FunctionDocProps = {
  name: string;
  signature: string;
  language?: string;
  summary?: ReactNode;
  arguments?: FunctionParameter[];
  keywordArguments?: FunctionParameter[];
  returns?: FunctionReturn;
  example?: string;
  children?: ReactNode;
};

function formatLabel(param: FunctionParameter) {
  return param.name;
}

function renderParameterSection(
  title: string,
  items: FunctionParameter[],
  styles: Record<string, string>,
) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <dl className={styles.list}>
        {items.map((param) => (
          <div key={param.name} className={styles.row}>
            <dt className={styles.term}>
              <code>{formatLabel(param)}</code>
              {param.type ? <span className={styles.type}>{param.type}</span> : null}
              {param.defaultValue ? <span className={styles.default}>= {param.defaultValue}</span> : null}
            </dt>
            <dd className={styles.description}>{param.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function FunctionDoc({
  name,
  signature,
  language = "julia",
  summary,
  arguments: argumentsList = [],
  keywordArguments = [],
  returns,
  example,
  children,
}: FunctionDocProps) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>Function</div>
        <div className={styles.title}>{name}</div>
      </header>

      <div className={styles.signatureBlock}>
        <code className={styles.signatureCode}>{signature}</code>
      </div>

      {summary ? <p className={styles.summary}>{summary}</p> : null}

      {renderParameterSection("Arguments", argumentsList, styles)}
      {renderParameterSection("Keyword Arguments", keywordArguments, styles)}

      {returns ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Returns</h3>
          <div className={styles.returnBlock}>
            {returns.type ? <div className={styles.returnType}>{returns.type}</div> : null}
            <div className={styles.description}>{returns.description}</div>
          </div>
        </section>
      ) : null}

      {example ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Example</h3>
          <div className={styles.signatureBlock}>
            <code className={styles.signatureCode}>{example}</code>
          </div>
        </section>
      ) : null}

      {children ? <section className={styles.section}>{children}</section> : null}
    </article>
  );
}
