import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';

type Props = {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  bgColor: string;
  textColor: string;
  borderColor: string;
};

export const CalloutBox: React.FC<Props> = ({ text, position, bgColor, textColor, borderColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 12 } });
  const exit = frame > durationInFrames - 15
    ? interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
    : 1;

  const scale = enter * exit;

  const positionStyle: Record<string, React.CSSProperties> = {
    'top-left': { top: 80, left: 80 },
    'top-right': { top: 80, right: 80 },
    'bottom-left': { bottom: 80, left: 80 },
    'bottom-right': { bottom: 80, right: 80 },
  };

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          ...positionStyle[position],
          backgroundColor: bgColor,
          border: `3px solid ${borderColor}`,
          borderRadius: 12,
          padding: '16px 24px',
          maxWidth: 400,
          transform: `scale(${scale})`,
          opacity: scale,
          transformOrigin: position.includes('left') ? 'left' : 'right',
        }}
      >
        <p style={{ fontSize: 24, fontWeight: 600, color: textColor, fontFamily: 'Inter, sans-serif', margin: 0 }}>
          {text}
        </p>
      </div>
    </AbsoluteFill>
  );
};
