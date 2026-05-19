import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';

type Props = {
  text: string;
  style: 'bounce' | 'fade' | 'slide' | 'typewriter';
  bgColor: string;
  textColor: string;
};

export const TextReveal: React.FC<Props> = ({ text, style, bgColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        {words.map((word, i) => {
          const delay = i * 5;
          const progress = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 100 } });

          const transform = style === 'bounce'
            ? `translateY(${interpolate(progress, [0, 1], [40, 0])}px) scale(${interpolate(progress, [0, 1], [0.5, 1])})`
            : style === 'slide'
              ? `translateX(${interpolate(progress, [0, 1], [-60, 0])}px)`
              : 'none';

          return (
            <span
              key={i}
              style={{
                fontSize: 64,
                fontWeight: 900,
                color: textColor,
                fontFamily: 'Inter, sans-serif',
                opacity: progress,
                transform,
                display: 'inline-block',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
