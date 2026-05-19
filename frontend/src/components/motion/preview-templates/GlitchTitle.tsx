import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

type Props = {
  title: string;
  bgColor: string;
  textColor: string;
  glitchColor: string;
};

export const GlitchTitle: React.FC<Props> = ({ title, bgColor, textColor, glitchColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const opacity = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Glitch offset (random-ish based on frame)
  const glitchActive = (frame % 15 < 2) && frame > 10 && frame < durationInFrames - 10;
  const offsetX = glitchActive ? (frame % 7) - 3 : 0;
  const offsetY = glitchActive ? (frame % 5) - 2 : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', opacity }}>
      {/* Glitch layers */}
      {glitchActive && (
        <>
          <h1 style={{ position: 'absolute', fontSize: 80, fontWeight: 900, color: glitchColor, fontFamily: 'Inter, sans-serif', transform: `translate(${offsetX * 2}px, ${offsetY}px)`, opacity: 0.7, mixBlendMode: 'screen' }}>
            {title}
          </h1>
          <h1 style={{ position: 'absolute', fontSize: 80, fontWeight: 900, color: '#ff0066', fontFamily: 'Inter, sans-serif', transform: `translate(${-offsetX}px, ${-offsetY * 2}px)`, opacity: 0.5, mixBlendMode: 'screen' }}>
            {title}
          </h1>
        </>
      )}
      <h1 style={{ fontSize: 80, fontWeight: 900, color: textColor, fontFamily: 'Inter, sans-serif', textAlign: 'center', maxWidth: '80%' }}>
        {title}
      </h1>
    </AbsoluteFill>
  );
};
