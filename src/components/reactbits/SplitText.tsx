type SplitTextProps = {
  text: string;
  className?: string;
};

/** Word-level Split Text wrapper, animated by the page's GSAP timeline. */
export function SplitText({ text, className = "" }: SplitTextProps) {
  return (
    <span className={`split-text ${className}`} aria-hidden="true">
      {text.split(" ").map((word, index) => (
        <span className="split-text-word" key={`${word}-${index}`} aria-hidden="true">
          <span className="split-text-inner">{word}</span>
        </span>
      ))}
    </span>
  );
}
