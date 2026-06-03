import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';

type Props = {
  logoText: string;
  effect: 'zoom' | 'spin' | 'reveal';
  bgColor: string;
  textColor: string;
};

export const LogoIntro: React.FC<Props> = ({ logoText, effect, bgColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 8, stiffness: 80 } });
  const exit = frame > durationInFrames - 20
    ? interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
    : 1;

  const getTransform = () => {
    const scale = interpolate(enter, [0, 1], [0.3, 1]);
    switch (effect) {
      case 'zoom': return `scale(${scale * exit})`;
      case 'spin': return `scale(${scale * exit}) rotate(${interpolate(enter, [0, 1], [180, 0])}deg)`;
      case 'reveal': return `translateY(${interpolate(enter, [0, 1], [60, 0])}px) scale(${exit})`;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: textColor,
          fontFamily: 'Inter, sans-serif',
          transform: getTransform(),
          opacity: enter * exit,
          letterSpacing: -2,
        }}
      >
        {logoText}
      </div>
    </AbsoluteFill>
  );
};
