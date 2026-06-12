'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface WizardStepperProps {
    currentStep: number
    maxReachedStep: number
    onStepClick: (step: number) => void
}

const steps = [
    { num: 1, label: 'Pilih Sumber' },
    { num: 2, label: 'Pilih Artikel' },
    { num: 3, label: 'Generate' },
    { num: 4, label: 'Edit & Publish' },
]

export function WizardStepper({ currentStep, maxReachedStep, onStepClick }: WizardStepperProps) {
    return (
        <div className="flex items-center justify-center gap-2 md:gap-0 mb-6 flex-shrink-0">
            {steps.map((step, i) => {
                const isCompleted = currentStep > step.num
                const isCurrent = currentStep === step.num
                const isAccessible = step.num <= maxReachedStep

                return (
                    <div key={step.num} className="flex items-center">
                        {/* Step circle + label */}
                        <button
                            onClick={() => isAccessible && onStepClick(step.num)}
                            disabled={!isAccessible}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                                isCurrent
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none'
                                    : isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                isCurrent
                                    ? 'bg-white text-blue-600'
                                    : isCompleted
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-400'
                            }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                            </div>
                            <span className="text-xs font-bold hidden md:block">{step.label}</span>
                        </button>

                        {/* Connector line */}
                        {i < steps.length - 1 && (
                            <div className={`w-8 md:w-16 h-0.5 mx-1 ${
                                currentStep > step.num ? 'bg-emerald-400' : 'bg-slate-200'
                            }`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
