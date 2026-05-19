'use client'

import { Player } from '@remotion/player'

import { TitleCard } from './preview-templates/TitleCard'
import { LowerThird } from './preview-templates/LowerThird'
import { TextReveal } from './preview-templates/TextReveal'
import { CounterAnimation } from './preview-templates/CounterAnimation'
import { GlitchTitle } from './preview-templates/GlitchTitle'
import { LogoIntro } from './preview-templates/LogoIntro'
import { SubscribeButton } from './preview-templates/SubscribeButton'
import { TransitionSwipe } from './preview-templates/TransitionSwipe'
import { CalloutBox } from './preview-templates/CalloutBox'
import { AutoCaption } from './preview-templates/AutoCaption'
import { AnimatedBackground } from './preview-templates/AnimatedBackground'

const COMPONENTS: Record<string, React.FC<any>> = {
  TitleCard,
  LowerThird,
  TextReveal,
  CounterAnimation,
  GlitchTitle,
  LogoIntro,
  SubscribeButton,
  TransitionSwipe,
  CalloutBox,
  AutoCaption,
  AnimatedBackground,
}

type Props = {
  templateId: string
  inputProps: Record<string, any>
  width?: number
  height?: number
  durationInFrames?: number
}

export function MotionPreview({ templateId, inputProps, width = 1920, height = 1080, durationInFrames = 90 }: Props) {
  const Component = COMPONENTS[templateId]

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-48 rounded-lg bg-slate-100 text-slate-500 text-sm">
        Preview tidak tersedia untuk template ini
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border">
      <Player
        component={Component}
        inputProps={inputProps}
        durationInFrames={durationInFrames}
        fps={30}
        compositionWidth={width}
        compositionHeight={height}
        style={{ width: '100%', aspectRatio: `${width}/${height}` }}
        controls
        autoPlay
        loop
      />
    </div>
  )
}
