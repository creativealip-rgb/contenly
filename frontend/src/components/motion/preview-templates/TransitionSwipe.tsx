import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

type Props = {
  text: string;
  direction: 'left' | 'right' | 'up' | 'down';
  color: string;
};

export const TransitionSwipe: React.FC<Props> = ({ text, direction, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const progress = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const getTransform = () => {
    const offset = interpolate(progress, [0, 1], [100, 0]);
    switch (direction) {
      case 'left': return `translateX(${offset}%)`;
      case 'right': return `translateX(${-offset}%)`;
      case 'up': return `translateY(${offset}%)`;
      case 'down': return `translateY(${-offset}%)`;
    }
  };

  const textOpacity = spring({ frame: frame - 10, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill>
      {/* Swipe panel */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: color, transform: getTransform() }} />

      {/* Text overlay */}
      {text && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', fontFamily: 'Inter, sans-serif', opacity: textOpacity }}>
            {text}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
