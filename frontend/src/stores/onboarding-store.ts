import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingStep {
    id: string
    title: string
    description: string
    targetElement?: string
    position?: 'top' | 'bottom' | 'left' | 'right'
}

export const onboardingSteps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Selamat Datang di Contenly!',
        description: 'Platform otomasi konten AI untuk mempercepat workflow konten Anda. Mari kita mulai dengan tour singkat.',
    },
    {
        id: 'connect-wordpress',
        title: 'Hubungkan WordPress',
        description: 'Integrasikan situs WordPress Anda untuk publishing otomatis. Bisa juga dilakukan nanti di Pengaturan.',
        targetElement: '[data-tour="integrations"]',
        position: 'bottom',
    },
    {
        id: 'content-lab',
        title: 'Content Lab',
        description: 'Buat artikel AI dari RSS feed, ide, atau rewrite konten existing di sini.',
        targetElement: '[data-tour="content-lab"]',
        position: 'right',
    },
    {
        id: 'instagram-studio',
        title: 'Instagram Studio',
        description: 'Buat carousel Instagram dengan AI. Generate storyboard, gambar, dan text overlay otomatis.',
        targetElement: '[data-tour="instagram-studio"]',
        position: 'right',
    },
    {
        id: 'video-scripts',
        title: 'Video Scripts',
        description: 'Generate script video untuk TikTok, Reels, dan YouTube Shorts dengan AI.',
        targetElement: '[data-tour="video-scripts"]',
        position: 'right',
    },
    {
        id: 'calendar',
        title: 'Content Calendar',
        description: 'Jadwalkan dan manage konten Anda dengan drag & drop calendar.',
        targetElement: '[data-tour="calendar"]',
        position: 'right',
    },
    {
        id: 'complete',
        title: 'Siap Beraksi!',
        description: 'Anda sudah siap membuat konten viral. Jelajahi fitur-fitur dan mulai create!',
    },
]

interface OnboardingStore {
    isOnboarding: boolean
    currentStep: number
    hasCompletedOnboarding: boolean
    skipped: boolean
    startOnboarding: () => void
    nextStep: () => void
    prevStep: () => void
    skipOnboarding: () => void
    completeOnboarding: () => void
    resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
    persist(
        (set, get) => ({
            isOnboarding: false,
            currentStep: 0,
            hasCompletedOnboarding: false,
            skipped: false,
            startOnboarding: () => set({ isOnboarding: true, currentStep: 0 }),
            nextStep: () => {
                const { currentStep } = get()
                if (currentStep < onboardingSteps.length - 1) {
                    set({ currentStep: currentStep + 1 })
                } else {
                    set({ 
                        isOnboarding: false, 
                        hasCompletedOnboarding: true,
                        currentStep: 0,
                    })
                }
            },
            prevStep: () => {
                const { currentStep } = get()
                if (currentStep > 0) {
                    set({ currentStep: currentStep - 1 })
                }
            },
            skipOnboarding: () => set({ 
                isOnboarding: false, 
                skipped: true,
                currentStep: 0,
            }),
            completeOnboarding: () => set({ 
                isOnboarding: false, 
                hasCompletedOnboarding: true,
                currentStep: 0,
            }),
            resetOnboarding: () => set({
                isOnboarding: false,
                currentStep: 0,
                hasCompletedOnboarding: false,
                skipped: false,
            }),
        }),
        {
            name: 'contenly-onboarding',
        }
    )
)
