import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

type Props = {
  percentage: number;
  label: string;
  bgColor: string;
  barColor: string;
  textColor: string;
};

export const ProgressBar: React.FC<Props> = ({ percentage, label, bgColor, barColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [10, durationInFrames * 0.7], [0, percentage], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const labelOpacity = spring({ frame: frame - 5, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 80 }}>
      <div style={{ width: '70%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, opacity: labelOpacity }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: textColor, fontFamily: 'Inter, sans-serif' }}>{label}</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: barColor, fontFamily: 'Inter, sans-serif' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ width: '100%', height: 20, backgroundColor: `${barColor}22`, borderRadius: 10 }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: barColor, borderRadius: 10, transition: 'none' }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
