import FigRef from "./FigRef";

type TableRefProps = {
  to: string;
  number?: string;
  label?: string;
};

export default function TableRef({
  to,
  number,
  label = "Table",
}: TableRefProps) {
  return <FigRef to={to} number={number} label={label} />;
}
