import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

type Props = {
  quote: string;
  author: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
};

export const QuoteCard: React.FC<Props> = ({ quote, author, bgColor, textColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quoteProgress = spring({ frame, fps, config: { damping: 14 } });
  const authorProgress = spring({ frame: frame - 20, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 80 }}>
      <div style={{ textAlign: 'center', maxWidth: '80%', opacity: quoteProgress, transform: `scale(${interpolate(quoteProgress, [0, 1], [0.9, 1])})` }}>
        <div style={{ fontSize: 72, color: accentColor, fontFamily: 'Georgia, serif', lineHeight: 0.5, marginBottom: 20 }}>&quot;</div>
        <p style={{ fontSize: 36, fontWeight: 500, color: textColor, fontFamily: 'Georgia, serif', lineHeight: 1.5, fontStyle: 'italic' }}>
          {quote}
        </p>
        <div style={{ marginTop: 24, opacity: Math.max(0, authorProgress), transform: `translateY(${interpolate(Math.max(0, authorProgress), [0, 1], [10, 0])}px)` }}>
          <span style={{ fontSize: 20, color: accentColor, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>— {author}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
