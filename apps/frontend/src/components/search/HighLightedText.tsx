interface IHighLightedText {
  highlight?: string;
  fallback: string;
}

export function HighlightedText({ highlight, fallback }: IHighLightedText) {
  if (!highlight) {
    return <p className="text-zinc-400 text-sm">{fallback}</p>;
  }

  const parts = highlight.split(/(<em>.*?<\/em>)/g);

  return (
    <p className="text-zinc-400 text-sm">
      {parts.map((part, i) => {
        if (part.startsWith('<em>') && part.endsWith('</em>')) {
          const text = part.slice(4, -5);
          return (
            <mark key={i} className="bg-transparent text-yellow-300 font-medium not-italic">
              {text}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}