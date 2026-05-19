import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

type WordTiming = {
  word: string;
  start: number; // in seconds
  end: number;
};

type Props = {
  words: WordTiming[];
  style: 'classic' | 'neon' | 'bounce' | 'highlight' | 'karaoke';
  textColor: string;
  highlightColor: string;
  fontSize: number;
};

export const AutoCaption: React.FC<Props> = ({ words, style, textColor, highlightColor, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Group words into lines of ~5 words
  const linesOfWords: WordTiming[][] = [];
  for (let i = 0; i < words.length; i += 5) {
    linesOfWords.push(words.slice(i, i + 5));
  }

  // Find current line
  const currentLineIdx = linesOfWords.findIndex((line) =>
    line.some((w) => currentTime >= w.start && currentTime <= w.end),
  );
  const currentLine = linesOfWords[currentLineIdx] || [];

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: '85%' }}>
        {currentLine.map((wordData, i) => {
          const isActive = currentTime >= wordData.start && currentTime <= wordData.end;
          const hasAppeared = currentTime >= wordData.start;

          const wordSpring = spring({
            frame: frame - Math.round(wordData.start * fps),
            fps,
            config: { damping: 10, stiffness: 150 },
          });

          const getWordStyle = (): React.CSSProperties => {
            const base: React.CSSProperties = {
              fontSize,
              fontWeight: 900,
              fontFamily: 'Inter, sans-serif',
              display: 'inline-block',
              opacity: hasAppeared ? 1 : 0.3,
            };

            switch (style) {
              case 'highlight':
                return {
                  ...base,
                  color: isActive ? highlightColor : textColor,
                  backgroundColor: isActive ? `${highlightColor}22` : 'transparent',
                  padding: '2px 6px',
                  borderRadius: 4,
                };
              case 'bounce':
                return {
                  ...base,
                  color: isActive ? highlightColor : textColor,
                  transform: isActive ? `scale(${interpolate(wordSpring, [0, 1], [1.3, 1])})` : 'scale(1)',
                };
              case 'neon':
                return {
                  ...base,
                  color: isActive ? highlightColor : textColor,
                  textShadow: isActive ? `0 0 10px ${highlightColor}, 0 0 20px ${highlightColor}` : 'none',
                };
              case 'karaoke':
                return {
                  ...base,
                  color: hasAppeared ? highlightColor : textColor,
                };
              default: // classic
                return {
                  ...base,
                  color: isActive ? highlightColor : textColor,
                };
            }
          };

          return (
            <span key={i} style={getWordStyle()}>
              {wordData.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
