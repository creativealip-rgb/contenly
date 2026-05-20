import { Composition } from 'remotion';
import { TitleCard } from './templates/TitleCard';
import { LowerThird } from './templates/LowerThird';
import { TextReveal } from './templates/TextReveal';
import { CounterAnimation } from './templates/CounterAnimation';
import { SubscribeButton } from './templates/SubscribeButton';
import { GlitchTitle } from './templates/GlitchTitle';
import { TransitionSwipe } from './templates/TransitionSwipe';
import { LogoIntro } from './templates/LogoIntro';
import { CalloutBox } from './templates/CalloutBox';
import { AutoCaption } from './templates/AutoCaption';
import { AnimatedBackground } from './templates/AnimatedBackground';
import { ComposedVideo } from './templates/ComposedVideo';
import { TypewriterText } from './templates/TypewriterText';
import { BulletList } from './templates/BulletList';
import { QuoteCard } from './templates/QuoteCard';
import { ProgressBar } from './templates/ProgressBar';
import { SplitScreen } from './templates/SplitScreen';
import { SocialProof } from './templates/SocialProof';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="TitleCard" component={TitleCard} durationInFrames={90} fps={30} width={1920} height={1080}
        defaultProps={{ title: 'Your Title Here', subtitle: '', style: 'modern', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#3b82f6' }} />
      <Composition id="LowerThird" component={LowerThird} durationInFrames={90} fps={30} width={1920} height={1080}
        defaultProps={{ name: 'John Doe', title: 'Content Creator', style: 'clean', accentColor: '#3b82f6' }} />
      <Composition id="TextReveal" component={TextReveal} durationInFrames={60} fps={30} width={1080} height={1920}
        defaultProps={{ text: 'Breaking News', style: 'bounce', bgColor: '#000000', textColor: '#ffffff' }} />
      <Composition id="CounterAnimation" component={CounterAnimation} durationInFrames={90} fps={30} width={1080} height={1080}
        defaultProps={{ from: 0, to: 1000000, label: 'Subscribers', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#10b981' }} />
      <Composition id="SubscribeButton" component={SubscribeButton} durationInFrames={60} fps={30} width={1920} height={1080}
        defaultProps={{ channel: '@YourChannel', style: 'youtube' }} />
      <Composition id="GlitchTitle" component={GlitchTitle} durationInFrames={75} fps={30} width={1920} height={1080}
        defaultProps={{ title: 'GLITCH', bgColor: '#000000', textColor: '#ffffff', glitchColor: '#00ffff' }} />
      <Composition id="TransitionSwipe" component={TransitionSwipe} durationInFrames={45} fps={30} width={1920} height={1080}
        defaultProps={{ text: '', direction: 'left', color: '#3b82f6' }} />
      <Composition id="LogoIntro" component={LogoIntro} durationInFrames={75} fps={30} width={1920} height={1080}
        defaultProps={{ logoText: 'BRAND', effect: 'zoom', bgColor: '#0f172a', textColor: '#ffffff' }} />
      <Composition id="CalloutBox" component={CalloutBox} durationInFrames={90} fps={30} width={1920} height={1080}
        defaultProps={{ text: 'Important note here!', position: 'bottom-left', bgColor: '#1e293b', textColor: '#ffffff', borderColor: '#3b82f6' }} />
      <Composition id="AutoCaption" component={AutoCaption} durationInFrames={150} fps={30} width={1080} height={1920}
        defaultProps={{ words: [{ word: 'Hello', start: 0, end: 0.5 }, { word: 'World', start: 0.5, end: 1 }], style: 'highlight', textColor: '#ffffff', highlightColor: '#facc15', fontSize: 48 }} />
      <Composition id="AnimatedBackground" component={AnimatedBackground} durationInFrames={300} fps={30} width={1920} height={1080}
        defaultProps={{ type: 'gradient-mesh', color1: '#0f172a', color2: '#3b82f6', color3: '#8b5cf6', speed: 1 }} />
      <Composition id="ComposedVideo" component={ComposedVideo} durationInFrames={300} fps={30} width={1080} height={1920}
        defaultProps={{ scenes: [], title: 'Video', showCaptions: true, captionStyle: 'classic', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#3b82f6' }} />
      <Composition id="TypewriterText" component={TypewriterText} durationInFrames={90} fps={30} width={1920} height={1080}
        defaultProps={{ text: 'Hello World...', bgColor: '#0f172a', textColor: '#22c55e', speed: 1 }} />
      <Composition id="BulletList" component={BulletList} durationInFrames={90} fps={30} width={1920} height={1080}
        defaultProps={{ items: ['Point one', 'Point two', 'Point three', 'Point four'], bgColor: '#0f172a', textColor: '#ffffff', bulletColor: '#3b82f6', style: 'slide' as const }} />
      <Composition id="QuoteCard" component={QuoteCard} durationInFrames={90} fps={30} width={1080} height={1080}
        defaultProps={{ quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', bgColor: '#0f172a', textColor: '#ffffff', accentColor: '#f59e0b' }} />
      <Composition id="ProgressBar" component={ProgressBar} durationInFrames={75} fps={30} width={1920} height={1080}
        defaultProps={{ percentage: 85, label: 'Completion', bgColor: '#0f172a', barColor: '#10b981', textColor: '#ffffff' }} />
      <Composition id="SplitScreen" component={SplitScreen} durationInFrames={75} fps={30} width={1920} height={1080}
        defaultProps={{ title: 'BEFORE', subtitle: 'After the transformation', bgColor: '#1e293b', textColor: '#ffffff', accentColor: '#3b82f6' }} />
      <Composition id="SocialProof" component={SocialProof} durationInFrames={75} fps={30} width={1080} height={1080}
        defaultProps={{ handle: '@creator', followers: '1.2M', bio: 'Content Creator & Educator', bgColor: '#f1f5f9', accentColor: '#8b5cf6' }} />
    </>
  );
};
