type EqRefProps = {
  to: string;
  number?: string;
  label?: string;
};

export default function EqRef({ to, number, label = "Eq." }: EqRefProps) {
  return <a href={`#${to}`}>{number ? `${label} (${number})` : label}</a>;
}
