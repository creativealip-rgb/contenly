import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';

type Props = {
  text: string;
  bgColor: string;
  textColor: string;
  speed: number;
};

export const TypewriterText: React.FC<Props> = ({ text, bgColor, textColor, speed }) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.min(text.length, Math.floor(frame * (speed || 1) * 0.5));
  const displayText = text.substring(0, charsToShow);
  const showCursor = frame % 16 < 10;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <span style={{ fontSize: 56, fontWeight: 700, color: textColor, fontFamily: 'monospace' }}>
        {displayText}
        {showCursor && <span style={{ opacity: 0.8 }}>|</span>}
      </span>
    </AbsoluteFill>
  );
};
