export default function SectionLabel({ text }: { text: string }) {
  return (
    <div className="section-label">
      <span className="sl-line" />
      <span className="sl-text">{text}</span>
      <span className="sl-line" />
    </div>
  );
}
