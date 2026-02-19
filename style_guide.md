# Contenly Design System: Style Guide

The Contenly design system is a modern, content-focused aesthetic that combines **Glassmorphism**, **Fluid Animations**, and a **Vibrant Color Palette** (Sky Blue & Cyan) to create a premium, clean, and interactive user experience for content creators and publishers.

---

## 🎨 Color Palette

### 1. Core Colors
| Token | Light Mode (HSL) | Dark Mode (HSL) | Description |
| :--- | :--- | :--- | :--- |
| **Background** | `204 100% 97%` (Sky 50) | `222 47% 11%` (Slate 900) | Main background surface |
| **Primary** | `199 89% 48%` (Sky 500) | `199 89% 55%` (Sky 500) | Brand color (Call to actions) |
| **Secondary** | `187 94% 53%` (Cyan 400) | `187 94% 60%` (Cyan 400) | Accent and highlights |
| **Foreground** | `222 47% 11%` (Slate 900) | `210 40% 98%` (Slate 50) | Main text color |

### 2. Functional Colors
*   **Success**: `142 76% 36%` (Emerald) - Used for published status and positive actions.
*   **Danger/Destructive**: `0 84% 60%` (Rose) - Used for errors and delete actions.
*   **Warning**: `38 92% 50%` (Amber) - Used for alerts and scheduled content.

---

## 🏙️ Glassmorphism & UI Layers

### 1. The "Glass" Utility
Contenly relies heavily on backdrop blur and subtle borders to create depth.
```css
.glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}
```

### 2. Card Design (`.card-clean`)
Cards should feel soft and interactive.
*   **Radius**: `1rem` (2xl/3xl in Tailwind).
*   **Shadow**: `shadow-xl shadow-slate-200/40`.
*   **Border**: `border border-white/40`.
*   **Hover State**: Scale `1.02`, lift `-4px`, and increase shadow.

---

## 🔡 Typography

*   **Primary Font**: `Inter` or `Sans-serif`.
*   **Headings**: Bold/Black, tracking-tight.
*   **Subtitles**: `text-slate-400`, uppercase, tracking-wider, `text-[11px]`.
*   **Numerical Data**: Always use `tabular-nums` for alignment in financial lists.

---

## ✨ Interactive Features

### 1. Framer Motion Patterns
All interactive elements should use micro-animations for a premium feel.

```tsx
// Standard Interactive Wrapper
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
  {content}
</motion.div>
```

### 2. Staggered Entrance
When loading lists (dashboard, features), use `staggerChildren: 0.1` to create a smooth cascading entrance.

---

## 📦 Components

### 1. Bottom Navigation
*   **Position**: Fixed to bottom, `z-[9999]`.
*   **Shape**: Rounded top corners (`rounded-t-2xl`).
*   **Indicator**: A pill-shaped `nav-indicator` that slides horizontally to the active item using `layoutId`.

### 2. Hero Balance Card
The centerpiece of the UI uses complex gradients.
*   **Gradient**: `bg-gradient-to-br from-sky-500 to-sky-600`.
*   **Decorations**: Radial glow effects in the background (`blur-3xl`).
*   **Glass Elements**: Child cards within the hero should use `bg-white/10 backdrop-blur-md`.

---

## 🌊 Animations
*   **Float**: A slow 6s float animation for background elements.
*   **Pulse Glow**: Subtle shadow pulses for active indicators or notifications.
*   **Shimmer**: Used for skeleton loading states to maintain perceived performance.

---

> [!TIP]
> **Key Consistency Rule**: Always use **Sky Blue** as the primary focus, and use **Emerald/Rose** strictly for status indicators. Maintain a high `backdrop-blur` (at least 20px) for all floating UI elements.
