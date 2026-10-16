/** Renders each string as a masked line for the `.line` reveal. */
export default function Lines({ lines, start = 0, lineClassName = '' }) {
  return lines.map((text, i) => (
    <span className={`line ${lineClassName}`.trim()} key={`${text}-${i}`}>
      <span className="line__inner" style={{ '--i': start + i }}>
        {text}
      </span>
    </span>
  ));
}
