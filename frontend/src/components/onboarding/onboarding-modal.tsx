'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useOnboardingStore, onboardingSteps } from '@/stores/onboarding-store'
import { 
    ChevronRight, 
    ChevronLeft, 
    X, 
    Sparkles, 
    Instagram, 
    Video, 
    Calendar,
    FileText,
    CheckCircle2,
    Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const stepIcons: Record<string, React.ReactNode> = {
    welcome: <Sparkles className="h-8 w-8 text-amber-500" />,
    'connect-wordpress': <Globe className="h-8 w-8 text-blue-500" />,
    'content-lab': <FileText className="h-8 w-8 text-green-500" />,
    'instagram-studio': <Instagram className="h-8 w-8 text-pink-500" />,
    'video-scripts': <Video className="h-8 w-8 text-red-500" />,
    calendar: <Calendar className="h-8 w-8 text-purple-500" />,
    complete: <CheckCircle2 className="h-8 w-8 text-green-500" />,
}

export function OnboardingModal() {
    const { 
        isOnboarding, 
        currentStep, 
        nextStep, 
        prevStep, 
        skipOnboarding,
        completeOnboarding,
    } = useOnboardingStore()
    const [showWelcome, setShowWelcome] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const { hasCompletedOnboarding, skipped, startOnboarding } = useOnboardingStore.getState()
        
        // Check if user is new (no onboarding state in localStorage)
        const hasSeenWelcome = localStorage.getItem('contenly-welcome-shown')
        
        if (!hasCompletedOnboarding && !skipped && !hasSeenWelcome) {
            setShowWelcome(true)
            localStorage.setItem('contenly-welcome-shown', 'true')
        }
    }, [])

    const handleStartTour = () => {
        setShowWelcome(false)
        const { startOnboarding } = useOnboardingStore.getState()
        startOnboarding()
    }

    const handleSkip = () => {
        setShowWelcome(false)
        skipOnboarding()
    }

    const handleStepAction = () => {
        const step = onboardingSteps[currentStep]
        
        // Navigate to specific pages based on step
        switch (step.id) {
            case 'connect-wordpress':
                router.push('/integrations')
                completeOnboarding()
                return
            case 'content-lab':
                router.push('/content-lab')
                completeOnboarding()
                return
            case 'instagram-studio':
                router.push('/instagram-studio')
                completeOnboarding()
                return
            case 'video-scripts':
                router.push('/video-scripts')
                completeOnboarding()
                return
            case 'calendar':
                router.push('/calendar')
                completeOnboarding()
                return
        }
        
        nextStep()
    }

    if (!isOnboarding && !showWelcome) return null

    const step = onboardingSteps[currentStep]
    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === onboardingSteps.length - 1

    // Welcome Screen
    if (showWelcome) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                >
                    <Card className="w-full max-w-lg border-2 border-white/20 shadow-2xl">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <CardTitle className="text-3xl font-black">
                                Selamat Datang di Contenly!
                            </CardTitle>
                            <CardDescription className="text-lg">
                                Platform otomasi konten AI untuk mempercepat workflow konten Anda.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    <span className="text-sm">Buat artikel AI dari RSS atau ide</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <Instagram className="h-5 w-5 text-pink-500" />
                                    <span className="text-sm">Generate carousel Instagram otomatis</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <Video className="h-5 w-5 text-red-500" />
                                    <span className="text-sm">Script video untuk TikTok & Reels</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                    <Calendar className="h-5 w-5 text-purple-500" />
                                    <span className="text-sm">Jadwalkan konten dengan calendar</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={handleSkip}>
                                Lewati
                            </Button>
                            <Button className="flex-1" onClick={handleStartTour}>
                                Mulai Tour
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        )
    }

    // Tour Modal
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="w-full max-w-md border-2 border-white/20 shadow-2xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                    {stepIcons[step.id] || <Sparkles className="h-6 w-6 text-blue-500" />}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={skipOnboarding}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardTitle className="text-xl mt-4">{step.title}</CardTitle>
                            <CardDescription className="text-base">{step.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {onboardingSteps.map((_, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "h-2 w-2 rounded-full transition-colors",
                                            index === currentStep 
                                                ? "bg-blue-500" 
                                                : index < currentStep 
                                                    ? "bg-blue-300" 
                                                    : "bg-slate-200 dark:bg-slate-700"
                                        )}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                {!isFirstStep && (
                                    <Button variant="outline" size="sm" onClick={prevStep}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button size="sm" onClick={handleStepAction}>
                                    {isLastStep ? 'Selesai' : step.targetElement ? 'Coba Sekarang' : 'Lanjut'}
                                    {!isLastStep && !step.targetElement && <ChevronRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

// Tooltip component for highlighting elements during onboarding
export function OnboardingTooltip({ 
    children, 
    stepId,
}: { 
    children: React.ReactNode
    stepId: string 
}) {
    const { isOnboarding, currentStep } = useOnboardingStore()
    const step = onboardingSteps[currentStep]
    const isActive = isOnboarding && step?.targetElement === `[data-tour="${stepId}"]`

    return (
        <div data-tour={stepId} className="relative">
            {children}
            {isActive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-lg ring-4 ring-blue-500 ring-offset-4 z-40 pointer-events-none"
                />
            )}
        </div>
    )
}
