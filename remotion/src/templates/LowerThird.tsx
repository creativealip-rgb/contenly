import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

type Props = {
  name: string;
  title: string;
  style: 'clean' | 'gradient' | 'neon' | 'minimalist';
  accentColor: string;
};

export const LowerThird: React.FC<Props> = ({ name, title, style, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14 } });
  const exit = frame > durationInFrames - 20
    ? interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
    : 1;

  const progress = enter * exit;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 60 }}>
      <div
        style={{
          transform: `translateX(${interpolate(progress, [0, 1], [-200, 0])}px)`,
          opacity: progress,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Accent bar */}
        <div style={{ width: 4, height: 60, backgroundColor: accentColor, borderRadius: 2 }} />

        <div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
            {name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 400, color: '#94a3b8', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>
            {title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
