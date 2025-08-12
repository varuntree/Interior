# Design System Specification

## 0) Overview
This document defines the design system for the Interior Design Generator application. The system is built using **CSS Custom Properties (design tokens)** managed in `app/globals.css` and consumed through **Tailwind CSS** utilities. The design emphasizes a modern, clean aesthetic with excellent contrast and Australian interior design sensibilities. **The application is fully mobile-friendly** with responsive design patterns optimized for touch interactions and mobile-first user experience.

## 1) Architecture & Implementation

### Token-Based Design System
- **Design tokens** live in `app/globals.css` under `:root` and `.dark` selectors
- **Tailwind CSS** maps these tokens through `tailwind.config.js` using `hsl(var(--token-name))`  
- **shadcn/ui components** consume tokens automatically via Tailwind utilities
- **Dark/light mode** handled by `next-themes` with class-based switching

### Integration Flow
```
CSS Design Tokens (globals.css)
    ↓
Tailwind Config (tailwind.config.js) 
    ↓
shadcn/ui Components (components/ui/*) 
    ↓
Application Components (components/*)
    ↓
Pages & Layouts (app/*)
```

## 2) Color System

### Primary Brand Colors
- **Primary**: `hsl(203.8863 88.2845% 53.1373%)` - Modern blue for CTAs and highlights
- **Primary Foreground**: `hsl(0 0% 100%)` - White text on primary backgrounds

### Neutral Colors  
- **Background**: `hsl(0 0% 100%)` (light) / `hsl(0 0% 0%)` (dark)
- **Foreground**: `hsl(210 25% 7.8431%)` (light) / `hsl(200 6.6667% 91.1765%)` (dark)
- **Card**: `hsl(180 6.6667% 97.0588%)` (light) / `hsl(228 9.8039% 10%)` (dark)
- **Muted**: `hsl(240 1.9608% 90%)` (light) / `hsl(0 0% 9.4118%)` (dark)

### Interactive Colors
- **Accent**: `hsl(211.5789 51.3514% 92.7451%)` (light) / `hsl(205.7143 70% 7.8431%)` (dark)
- **Border**: `hsl(201.4286 30.4348% 90.9804%)` (light) / `hsl(210 5.2632% 14.9020%)` (dark)
- **Input**: `hsl(200 23.0769% 97.4510%)` (light) / `hsl(207.6923 27.6596% 18.4314%)` (dark)

### Semantic Colors
- **Destructive**: `hsl(356.3033 90.5579% 54.3137%)` - Error states and dangerous actions
- **Ring**: `hsl(202.8169 89.1213% 53.1373%)` - Focus rings and active states

### Chart Colors (Data Visualization)
- **Chart 1**: `hsl(203.8863 88.2845% 53.1373%)` - Primary blue
- **Chart 2**: `hsl(159.7826 100% 36.0784%)` - Emerald green  
- **Chart 3**: `hsl(42.0290 92.8251% 56.2745%)` - Warm yellow
- **Chart 4**: `hsl(147.1429 78.5047% 41.9608%)` - Forest green
- **Chart 5**: `hsl(341.4894 75.2000% 50.9804%)` - Pink accent

### Sidebar Colors (Dashboard UI)
Complete sidebar color scheme with primary, accent, and border variants for dashboard layouts.

## 3) Typography System

### Font Families
- **Sans**: `var(--font-open-sans, 'Open Sans'), system-ui, sans-serif` - Primary UI font
- **Serif**: `Georgia, serif` - Headings and editorial content
- **Mono**: `Menlo, monospace` - Code and technical content

### Font Loading Strategy
- **Open Sans** loaded via `next/font/google` with `display: "swap"`
- CSS variable `--font-open-sans` set in `app/layout.tsx`
- Tailwind classes: `font-sans`, `font-serif`, `font-mono`

### Typography Hierarchy
Leverages Tailwind's built-in typography scale with design token integration:
- **Headings**: Use `font-serif` for editorial feel or `font-sans` for modern UI
- **Body**: `font-sans` for optimal readability
- **Code**: `font-mono` for technical content

## 4) Spacing & Layout

### Border Radius System
- **Base Radius**: `1.3rem` - Modern, rounded aesthetic
- **Tailwind Classes**: 
  - `rounded-lg` = `var(--radius)` (1.3rem)
  - `rounded-md` = `calc(var(--radius) - 2px)` (1.1rem)  
  - `rounded-sm` = `calc(var(--radius) - 4px)` (0.9rem)

### Spacing Scale
- **Base Spacing**: `0.25rem` - Fundamental spacing unit
- Uses Tailwind's standard spacing scale: `p-1`, `p-2`, `p-4`, etc.

### Layout Tokens
- **Letter Spacing**: `--tracking-normal: 0em` - Clean, untracked text

## 5) Shadow System (Minimal Design)

### Philosophy
Intentionally **minimal/flat design** with zero-opacity shadows for clean, modern aesthetic.

### Shadow Tokens
All shadows use `hsl(202.8169 89.1213% 53.1373% / 0.00)` - primary color at 0% opacity:
- `--shadow-2xs` through `--shadow-2xl` - Consistent zero-shadow approach
- **Tailwind Classes**: `shadow-sm`, `shadow`, `shadow-md`, etc. - all render as flat/minimal

### Usage
- **Cards**: No visual shadows, rely on subtle borders and background colors
- **Interactive Elements**: Use color changes and transforms instead of shadow depth
- **Focus States**: Rely on ring utilities with design token colors

## 6) Dark Mode Implementation

### Theme Switching
- **Provider**: `next-themes` with class-based switching (`darkMode: ["class"]`)
- **Toggle Component**: `ThemeToggle.tsx` with light/dark/system options
- **Persistence**: Automatic theme persistence across sessions

### Dark Mode Strategy
- **Semantic Tokens**: Same token names, different values in `.dark` selector
- **Automatic Inheritance**: All components automatically adapt via Tailwind utilities
- **High Contrast**: Carefully chosen colors ensure excellent readability in both modes

### Dark Mode Colors
- **Darker Backgrounds**: True black `hsl(0 0% 0%)` for OLED-friendly design
- **Lighter Foregrounds**: High contrast text colors
- **Adjusted Interactives**: Darker accent and border colors for dark theme coherence

## 7) Component Integration

### shadcn/ui Components
All shadcn/ui components automatically consume design tokens via Tailwind:
- **Button**: Uses `bg-primary`, `text-primary-foreground`, etc.
- **Card**: Uses `bg-card`, `text-card-foreground`, etc.
- **Input**: Uses `border-input`, `bg-background`, etc.

### Custom Component Patterns
```tsx
// Recommended pattern for custom components
const CustomComponent = () => (
  <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
    <h2 className="text-foreground font-serif">Heading</h2>
    <p className="text-muted-foreground font-sans">Body text</p>
    <Button className="bg-primary text-primary-foreground">CTA</Button>
  </div>
)
```

## 8) Responsive Design & Mobile-First Approach

### Mobile-Friendly Architecture
The application follows a **mobile-first design philosophy** with:
- **Touch-optimized interactions** with appropriately sized tap targets
- **Responsive layouts** that adapt seamlessly across all device sizes
- **Mobile-first CSS** with progressive enhancement for larger screens
- **Fast loading fonts** with `display: "swap"` for optimal mobile performance

### Breakpoints
Uses Tailwind's default responsive system optimized for mobile:
- **Mobile**: `<768px` - Primary focus, single column, touch-optimized UI
- **Tablet**: `768px-1279px` - Two column layouts with improved spacing
- **Desktop**: `≥1280px` - Full three column layouts with enhanced features

### Mobile-Specific Considerations
- **Touch targets**: Minimum 44px/44px for interactive elements
- **Thumb-friendly navigation**: Bottom navigation and easy-reach CTAs
- **Swipe gestures**: Optimized for mobile gesture interactions
- **Viewport handling**: Proper viewport meta tags and responsive units

### Responsive Typography
- **Mobile-first scaling**: Base sizes optimized for mobile readability
- **Progressive enhancement**: `sm:text-lg`, `md:text-xl`, etc. for larger screens
- **Font loading**: Optimized for all screen sizes with `display: "swap"`
- **Line height**: Adjusted for comfortable mobile reading

## 9) Animation System

### Custom Animations
Defined in `tailwind.config.js` with design token integration:
- **opacity**: Smooth fade-in transitions
- **appearFromRight**: Slide-in animations  
- **wiggle**: Playful micro-interactions
- **popup**: Modal/tooltip reveals
- **shimmer**: Loading state animations

### Usage Guidelines
- **Subtle by Default**: Prefer smooth, subtle animations
- **Performance First**: CSS transforms over layout-shifting animations
- **Accessibility**: Respect `prefers-reduced-motion` settings

## 10) Development Guidelines

### Token Modification Process
1. **Update** `app/globals.css` tokens in both `:root` and `.dark` selectors
2. **Test** changes across light/dark themes  
3. **Verify** component rendering in multiple contexts
4. **Document** any breaking changes to component APIs

### Component Development
```tsx
// ✅ Good - Uses design tokens
<Button className="bg-primary text-primary-foreground">

// ❌ Bad - Hardcoded colors  
<Button className="bg-blue-500 text-white">
```

### Testing Checklist
- **Light/Dark Toggle**: All components render correctly in both themes
- **Responsive**: Layout adapts properly across breakpoints  
- **Accessibility**: Sufficient color contrast in all modes
- **Performance**: No layout shifts during theme transitions

## 11) Design Token Reference

### Complete Token List
```css
/* Color Tokens */
--background, --foreground
--card, --card-foreground  
--popover, --popover-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring

/* Chart Tokens */
--chart-1 through --chart-5

/* Sidebar Tokens */  
--sidebar, --sidebar-foreground
--sidebar-primary, --sidebar-primary-foreground
--sidebar-accent, --sidebar-accent-foreground
--sidebar-border, --sidebar-ring

/* Typography Tokens */
--font-sans, --font-serif, --font-mono

/* Layout Tokens */
--radius, --spacing, --tracking-normal

/* Shadow Tokens */
--shadow-2xs through --shadow-2xl
```

## 12) Future Considerations

### Potential Enhancements
- **Theme Variants**: Additional color themes beyond light/dark
- **Density Options**: Compact/comfortable spacing variants
- **Animation Preferences**: Expanded animation control settings
- **Brand Customization**: Client-specific color scheme overrides

### Backwards Compatibility
- **Token Stability**: Avoid breaking changes to core token names
- **Migration Path**: Clear upgrade paths for design system changes
- **Documentation**: Maintain comprehensive change logs for major updates

---

**File Location**: `ai_docs/spec/design_system.md`  
**Integration**: CSS tokens → Tailwind → shadcn/ui → Application  
**Theme Management**: `next-themes` with automatic persistence  
**Development**: Token-based, component-agnostic, responsive-first