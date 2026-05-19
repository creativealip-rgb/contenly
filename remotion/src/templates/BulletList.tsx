import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';

type Props = {
  items: string[];
  bgColor: string;
  textColor: string;
  bulletColor: string;
  style: 'slide' | 'bounce' | 'fade';
};

export const BulletList: React.FC<Props> = ({ items, bgColor, textColor, bulletColor, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', padding: '60px 100px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {items.map((item, i) => {
          const delay = i * 12;
          const progress = spring({ frame: frame - delay, fps, config: { damping: 12 } });
          const transform = style === 'slide' ? `translateX(${interpolate(progress, [0, 1], [-80, 0])}px)`
            : style === 'bounce' ? `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`
            : 'none';

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: progress, transform }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: bulletColor, flexShrink: 0 }} />
              <span style={{ fontSize: 32, fontWeight: 600, color: textColor, fontFamily: 'Inter, sans-serif' }}>{item}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
