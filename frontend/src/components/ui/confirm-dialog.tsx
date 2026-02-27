"use client"

import { useState, useCallback, createContext, useContext, ReactNode } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogState {
    open: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    onConfirm: () => void
}

interface ConfirmDialogContextType {
    confirm: (options: Omit<ConfirmDialogState, "open" | "onConfirm"> & { onConfirm: () => void }) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<Omit<ConfirmDialogState, "onConfirm"> & { onConfirm: (() => void) | null }>({
        open: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        variant: "default",
        onConfirm: null,
    })

    const confirm = useCallback((options: Omit<ConfirmDialogState, "open" | "onConfirm"> & { onConfirm: () => void }): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                ...options,
                open: true,
                onConfirm: () => {
                    options.onConfirm()
                    resolve(true)
                },
            })
        })
    }, [])

    const handleCancel = useCallback(() => {
        setState(prev => ({ ...prev, open: false }))
    }, [])

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open && state.onConfirm) {
            state.onConfirm = null
        }
        setState(prev => ({ ...prev, open }))
    }, [state.onConfirm])

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}
            <Dialog open={state.open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{state.title}</DialogTitle>
                        <DialogDescription>{state.description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setState(prev => ({ ...prev, open: false }))
                            }}
                        >
                            {state.cancelText || "Cancel"}
                        </Button>
                        <Button
                            type="button"
                            variant={state.variant as "default" | "destructive"}
                            onClick={() => {
                                if (state.onConfirm) {
                                    state.onConfirm()
                                }
                                setState(prev => ({ ...prev, open: false }))
                            }}
                        >
                            {state.confirmText || "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmDialogContext.Provider>
    )
}

export function useConfirm() {
    const context = useContext(ConfirmDialogContext)
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmDialogProvider")
    }
    return context.confirm
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    onConfirm,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    onConfirm: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant}
                        onClick={() => {
                            onConfirm()
                            onOpenChange(false)
                        }}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
