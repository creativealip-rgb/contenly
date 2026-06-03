import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

type Props = {
  type: 'gradient-mesh' | 'particles' | 'geometric' | 'waveform';
  color1: string;
  color2: string;
  color3: string;
  speed: number;
};

export const AnimatedBackground: React.FC<Props> = ({ type, color1, color2, color3, speed }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const t = (frame * speed) / 100;

  if (type === 'gradient-mesh') {
    const angle = interpolate(frame, [0, durationInFrames], [0, 360]);
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(${angle}deg, ${color1}, ${color2}, ${color3})`,
          backgroundSize: '400% 400%',
          backgroundPosition: `${50 + Math.sin(t) * 50}% ${50 + Math.cos(t) * 50}%`,
        }}
      />
    );
  }

  if (type === 'particles') {
    const particles = Array.from({ length: 30 }, (_, i) => {
      const x = ((i * 37 + frame * speed * 0.5) % 100);
      const y = ((i * 53 + frame * speed * 0.3) % 100);
      const size = 3 + (i % 5) * 2;
      const opacity = 0.3 + (i % 3) * 0.2;
      return { x, y, size, opacity };
    });

    return (
      <AbsoluteFill style={{ backgroundColor: color1 }}>
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: i % 2 === 0 ? color2 : color3,
              opacity: p.opacity,
            }}
          />
        ))}
      </AbsoluteFill>
    );
  }

  if (type === 'geometric') {
    const shapes = Array.from({ length: 12 }, (_, i) => {
      const rotation = (i * 30 + frame * speed * 0.5) % 360;
      const x = 20 + (i % 4) * 20;
      const y = 20 + Math.floor(i / 4) * 30;
      return { rotation, x, y };
    });

    return (
      <AbsoluteFill style={{ backgroundColor: color1 }}>
        {shapes.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: 60,
              height: 60,
              border: `2px solid ${i % 2 === 0 ? color2 : color3}`,
              borderRadius: i % 3 === 0 ? '50%' : 0,
              transform: `rotate(${s.rotation}deg)`,
              opacity: 0.4,
            }}
          />
        ))}
      </AbsoluteFill>
    );
  }

  // waveform
  const points = Array.from({ length: 50 }, (_, i) => {
    const x = (i / 49) * 100;
    const y = 50 + Math.sin((i * 0.3) + t * 2) * 20 + Math.cos((i * 0.5) + t) * 10;
    return `${x}% ${y}%`;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: color1 }}>
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <polyline
          points={points.map(p => {
            const [x, y] = p.split(' ');
            return `${parseFloat(x) / 100 * 1920},${parseFloat(y) / 100 * 1080}`;
          }).join(' ')}
          fill="none"
          stroke={color2}
          strokeWidth="3"
          opacity="0.6"
        />
      </svg>
    </AbsoluteFill>
  );
};
