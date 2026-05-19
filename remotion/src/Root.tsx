import { Composition } from 'remotion';
import { TitleCard } from './templates/TitleCard';
import { LowerThird } from './templates/LowerThird';
import { TextReveal } from './templates/TextReveal';
import { CounterAnimation } from './templates/CounterAnimation';
import { SubscribeButton } from './templates/SubscribeButton';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'Your Title Here',
          subtitle: '',
          style: 'modern',
          bgColor: '#0f172a',
          textColor: '#ffffff',
          accentColor: '#3b82f6',
        }}
      />
      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          name: 'John Doe',
          title: 'Content Creator',
          style: 'clean',
          accentColor: '#3b82f6',
        }}
      />
      <Composition
        id="TextReveal"
        component={TextReveal}
        durationInFrames={60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          text: 'Breaking News',
          style: 'bounce',
          bgColor: '#000000',
          textColor: '#ffffff',
        }}
      />
      <Composition
        id="CounterAnimation"
        component={CounterAnimation}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          from: 0,
          to: 1000000,
          label: 'Subscribers',
          bgColor: '#0f172a',
          textColor: '#ffffff',
          accentColor: '#10b981',
        }}
      />
      <Composition
        id="SubscribeButton"
        component={SubscribeButton}
        durationInFrames={60}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          channel: '@YourChannel',
          style: 'youtube',
        }}
      />
    </>
  );
};
