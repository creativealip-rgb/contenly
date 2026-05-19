import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';

type Props = {
  channel: string;
  style: 'youtube' | 'modern' | 'minimal';
};

export const SubscribeButton: React.FC<Props> = ({ channel, style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame: frame - 5, fps, config: { damping: 10 } });
  const bellRing = spring({ frame: frame - 30, fps, config: { damping: 6, stiffness: 200 } });
  const exit = frame > durationInFrames - 15
    ? interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
    : 1;

  const scale = enter * exit;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 100 }}>
      <div
        style={{
          transform: `scale(${scale})`,
          opacity: scale,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Subscribe button */}
        <div
          style={{
            backgroundColor: '#ff0000',
            color: '#ffffff',
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            padding: '16px 48px',
            borderRadius: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Subscribe
        </div>

        {/* Channel name */}
        <div style={{ fontSize: 20, color: '#ffffff', fontFamily: 'Inter, sans-serif', opacity: 0.8 }}>
          {channel}
        </div>

        {/* Bell icon (simple) */}
        <div
          style={{
            fontSize: 36,
            transform: `rotate(${interpolate(bellRing, [0, 1], [0, 15])}deg)`,
          }}
        >
          🔔
        </div>
      </div>
    </AbsoluteFill>
  );
};
