'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface JsonArrayEditorProps {
  value: unknown
  onChange: (value: unknown) => void
  label?: string
  /** 'array-strings' for simple string arrays, 'json' for raw JSON editing */
  mode?: 'array-strings' | 'json'
  placeholder?: string
}

/**
 * Editor for JSON props — supports:
 * - Simple string arrays (BulletList items)
 * - Raw JSON (AutoCaption words, complex props)
 */
export function JsonArrayEditor({ value, onChange, label, mode = 'json', placeholder }: JsonArrayEditorProps) {
  if (mode === 'array-strings') {
    return <StringArrayEditor value={value} onChange={onChange} label={label} placeholder={placeholder} />
  }
  return <RawJsonEditor value={value} onChange={onChange} label={label} />
}

function StringArrayEditor({ value, onChange, label, placeholder }: Omit<JsonArrayEditorProps, 'mode'>) {
  const items: string[] = Array.isArray(value) ? value : []

  const addItem = () => onChange([...items, ''])
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx))
  const updateItem = (idx: number, val: string) => {
    const next = [...items]
    next[idx] = val
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
          <Input
            value={item}
            onChange={(e) => updateItem(idx, e.target.value)}
            placeholder={placeholder || `Item ${idx + 1}`}
            className="h-8 text-sm"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(idx)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={addItem}>
        <Plus className="h-3 w-3 mr-1" /> Add Item
      </Button>
    </div>
  )
}

function RawJsonEditor({ value, onChange, label }: Omit<JsonArrayEditorProps, 'mode' | 'placeholder'>) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [error, setError] = useState<string | null>(null)

  const handleBlur = useCallback(() => {
    try {
      const parsed = JSON.parse(text)
      setError(null)
      onChange(parsed)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [text, onChange])

  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-medium text-muted-foreground">{label}</label>}
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        className="font-mono text-xs min-h-[100px]"
        spellCheck={false}
      />
      {error && <p className="text-xs text-red-500">Invalid JSON: {error}</p>}
    </div>
  )
}
