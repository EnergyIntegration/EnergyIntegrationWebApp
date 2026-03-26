type FigRefProps = {
  to: string;
  number?: string;
  label?: string;
};

export default function FigRef({ to, number, label = "Figure" }: FigRefProps) {
  return <a href={`#${to}`}>{number ? `${label} ${number}` : label}</a>;
}
