import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

type Props = {
  handle: string;
  followers: string;
  bio: string;
  bgColor: string;
  accentColor: string;
};

export const SocialProof: React.FC<Props> = ({ handle, followers, bio, bgColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardProgress = spring({ frame, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 48, width: 400, textAlign: 'center', transform: `scale(${interpolate(cardProgress, [0, 1], [0.8, 1])})`, opacity: cardProgress, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        {/* Avatar placeholder */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: accentColor, margin: '0 auto 16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: 32, color: '#fff' }}>👤</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Inter, sans-serif' }}>{handle}</div>
        <div style={{ fontSize: 18, color: '#666', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>{bio}</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: accentColor, fontFamily: 'Inter, sans-serif', marginTop: 16 }}>{followers}</div>
        <div style={{ fontSize: 14, color: '#999', fontFamily: 'Inter, sans-serif' }}>followers</div>
      </div>
    </AbsoluteFill>
  );
};
