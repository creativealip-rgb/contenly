import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

type Props = {
  title: string;
  subtitle?: string;
  style: 'modern' | 'neon' | 'minimal' | 'glitch' | 'kinetic';
  bgColor: string;
  textColor: string;
  accentColor: string;
};

export const TitleCard: React.FC<Props> = ({ title, subtitle, style, bgColor, textColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 12 } });
  const subtitleProgress = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const lineWidth = interpolate(frame, [0, 30], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
      {/* Accent line */}
      <div
        style={{
          width: `${lineWidth}%`,
          maxWidth: 400,
          height: 4,
          backgroundColor: accentColor,
          marginBottom: 24,
          borderRadius: 2,
        }}
      />

      {/* Title */}
      <h1
        style={{
          color: textColor,
          fontSize: style === 'kinetic' ? 96 : 72,
          fontWeight: 900,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'center',
          transform: `translateY(${interpolate(titleProgress, [0, 1], [40, 0])}px)`,
          opacity: titleProgress,
          maxWidth: '80%',
          lineHeight: 1.1,
        }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p
          style={{
            color: textColor,
            fontSize: 28,
            fontWeight: 400,
            fontFamily: 'Inter, sans-serif',
            opacity: Math.max(0, subtitleProgress),
            transform: `translateY(${interpolate(Math.max(0, subtitleProgress), [0, 1], [20, 0])}px)`,
            marginTop: 16,
          }}
        >
          {subtitle}
        </p>
      )}
    </AbsoluteFill>
  );
};
