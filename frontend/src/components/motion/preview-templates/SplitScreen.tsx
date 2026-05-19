import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

type Props = {
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
};

export const SplitScreen: React.FC<Props> = ({ title, subtitle, bgColor, textColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftProgress = spring({ frame, fps, config: { damping: 12 } });
  const rightProgress = spring({ frame: frame - 8, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      {/* Left panel */}
      <div style={{ flex: 1, backgroundColor: accentColor, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `translateX(${interpolate(leftProgress, [0, 1], [-100, 0])}%)` }}>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#ffffff', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 40 }}>
          {title}
        </h1>
      </div>
      {/* Right panel */}
      <div style={{ flex: 1, backgroundColor: bgColor, display: 'flex', justifyContent: 'center', alignItems: 'center', transform: `translateX(${interpolate(rightProgress, [0, 1], [100, 0])}%)` }}>
        <p style={{ fontSize: 28, fontWeight: 500, color: textColor, fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 40 }}>
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
