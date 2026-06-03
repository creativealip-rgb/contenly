import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

type Props = {
  from: number;
  to: number;
  label: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
};

export const CounterAnimation: React.FC<Props> = ({ from, to, label, bgColor, textColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [10, durationInFrames - 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Eased counter
  const eased = 1 - Math.pow(1 - progress, 3);
  const currentValue = Math.round(from + (to - from) * eased);

  const formatted = currentValue.toLocaleString();

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            color: accentColor,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: -2,
          }}
        >
          {formatted}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: textColor,
            fontFamily: 'Inter, sans-serif',
            marginTop: 8,
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
