import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, Img, Audio, interpolate, spring } from 'remotion';

type SceneData = {
  sceneNumber: number;
  voiceoverText: string;
  visualContext: string;
  estimatedDuration: number;
  emoji?: string;
  footageUrl?: string; // thumbnail/image URL for the scene
  audioUrl?: string; // TTS audio URL for the scene
};

type Props = {
  scenes: SceneData[];
  title: string;
  showCaptions: boolean;
  captionStyle: 'classic' | 'highlight' | 'bounce';
  bgColor: string;
  textColor: string;
  accentColor: string;
};

export const ComposedVideo: React.FC<Props> = ({ scenes, title, showCaptions, captionStyle, bgColor, textColor, accentColor }) => {
  const { fps } = useVideoConfig();

  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {scenes.map((scene, i) => {
        const durationFrames = (scene.estimatedDuration || 5) * fps;
        const startFrame = currentFrame;
        currentFrame += durationFrames;

        return (
          <Sequence key={i} from={startFrame} durationInFrames={durationFrames}>
            <SceneSlide
              scene={scene}
              index={i}
              total={scenes.length}
              showCaptions={showCaptions}
              captionStyle={captionStyle}
              bgColor={bgColor}
              textColor={textColor}
              accentColor={accentColor}
            />
          </Sequence>
        );
      })}

      {/* Title overlay at start */}
      <Sequence from={0} durationInFrames={fps * 2}>
        <TitleOverlay title={title} textColor={textColor} accentColor={accentColor} />
      </Sequence>
    </AbsoluteFill>
  );
};

const SceneSlide: React.FC<{
  scene: SceneData;
  index: number;
  total: number;
  showCaptions: boolean;
  captionStyle: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}> = ({ scene, index, total, showCaptions, bgColor, textColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enterProgress = spring({ frame, fps, config: { damping: 14 } });
  const exitProgress = frame > durationInFrames - 10
    ? interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Background footage/image */}
      {scene.footageUrl && (
        <Img
          src={scene.footageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4 * enterProgress * exitProgress,
          }}
        />
      )}

      {/* Scene number indicator */}
      <div style={{ position: 'absolute', top: 20, left: 20, opacity: 0.5 }}>
        <span style={{ fontSize: 14, color: textColor, fontFamily: 'Inter, sans-serif' }}>
          {scene.emoji || ''} Scene {scene.sceneNumber}/{total}
        </span>
      </div>

      {/* Caption / Voiceover text */}
      {showCaptions && (
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: '10%',
            right: '10%',
            textAlign: 'center',
            opacity: enterProgress * exitProgress,
            transform: `translateY(${interpolate(enterProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: textColor,
              fontFamily: 'Inter, sans-serif',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              lineHeight: 1.4,
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '12px 24px',
              borderRadius: 12,
              display: 'inline-block',
            }}
          >
            {scene.voiceoverText}
          </p>
        </div>
      )}

      {/* Audio */}
      {scene.audioUrl && <Audio src={scene.audioUrl} />}
    </AbsoluteFill>
  );
};

const TitleOverlay: React.FC<{ title: string; textColor: string; accentColor: string }> = ({ title, textColor, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div style={{ textAlign: 'center', opacity: progress, transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})` }}>
        <div style={{ width: 60, height: 4, backgroundColor: accentColor, margin: '0 auto 16px', borderRadius: 2 }} />
        <h1 style={{ fontSize: 48, fontWeight: 900, color: textColor, fontFamily: 'Inter, sans-serif' }}>{title}</h1>
      </div>
    </AbsoluteFill>
  );
};
