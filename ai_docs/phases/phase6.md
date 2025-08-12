# Phase 6: Dashboard UI & Core Flows
## Complete Dashboard Interface with All Features

### Phase Overview
**Duration**: 2-3 days
**Dependencies**: Phases 1-5 completed (all APIs functional)
**Goal**: Build the complete dashboard UI with Theme v2 design system

### Required Reading Before Starting
1. `/ai_docs/spec/ux_ui.md` - Complete UI specification
2. `/ai_docs/spec/design_system.md` - Theme v2 implementation
3. `/ai_docs/spec/prd.md` - User flows and features
4. `/ai_docs/docs/01-handbook.md` - Section 15 (Rendering/UI)

---

## Task 6.1: Dashboard Layout

### Update Dashboard Layout
Location: `app/(app)/dashboard/layout.tsx`

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/signin')
  }
  
  // Fetch user profile for plan info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          user={user} 
          profile={profile}
          className="hidden lg:flex"
        />
        
        {/* Mobile sidebar - will be toggled */}
        <Sidebar 
          user={user}
          profile={profile}
          className="lg:hidden"
          mobile
        />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
```

### Create Sidebar Component
Location: `components/dashboard/Sidebar.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/libs/utils'
import {
  Home,
  Sparkles,
  Images,
  FolderOpen,
  Users,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import runtimeConfig from '@/libs/app-config/runtime'

interface SidebarProps {
  user: any
  profile: any
  className?: string
  mobile?: boolean
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Create', href: '/dashboard/create', icon: Sparkles },
  { name: 'My Renders', href: '/dashboard/renders', icon: Images },
  { name: 'Collections', href: '/dashboard/collections', icon: FolderOpen },
  { name: 'Community', href: '/dashboard/community', icon: Users },
]

const bottomNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ user, profile, className, mobile }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-serif text-sidebar-foreground">
          Interior AI
        </h1>
      </div>
      
      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              onClick={() => mobile && setIsOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3">
        {/* Usage badge */}
        <div className="mb-3 rounded-lg bg-sidebar-accent px-3 py-2">
          <div className="text-xs text-sidebar-accent-foreground/70">
            Plan: {profile?.plan_label || 'Free'}
          </div>
          <div className="text-sm font-medium text-sidebar-accent-foreground">
            {/* This will be populated via API */}
            <UsageBadge userId={user.id} />
          </div>
        </div>
        
        {/* Settings */}
        {bottomNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
            onClick={() => mobile && setIsOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </div>
    </>
  )
  
  if (mobile) {
    return (
      <>
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-4 left-4 z-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
        
        {/* Mobile sidebar overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-sidebar transform transition-transform lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}>
          {sidebarContent}
        </div>
      </>
    )
  }
  
  return (
    <div className={cn('w-72 bg-sidebar border-r border-sidebar-border', className)}>
      {sidebarContent}
    </div>
  )
}

// Usage badge component
function UsageBadge({ userId }: { userId: string }) {
  // This would fetch from API
  return <span>-- / -- generations</span>
}
```

---

## Task 6.2: Create Page (Core Feature)

### Build Generation Workspace
Location: `app/(app)/dashboard/create/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageDropzone } from '@/components/dashboard/ImageDropzone'
import { GenerationResult } from '@/components/dashboard/GenerationResult'
import { GenerationProgress } from '@/components/dashboard/GenerationProgress'
import { toast } from '@/components/ui/use-toast'
import runtimeConfig from '@/libs/app-config/runtime'
import { Sparkles, Image, Layers, Wand } from 'lucide-react'

const modes = [
  { id: 'redesign', label: 'Redesign', icon: Sparkles, description: 'Keep structure, change style' },
  { id: 'staging', label: 'Virtual Staging', icon: Image, description: 'Furnish empty rooms' },
  { id: 'compose', label: 'Compose', icon: Layers, description: 'Merge two images' },
  { id: 'imagine', label: 'Imagine', icon: Wand, description: 'Create from text' },
] as const

export default function CreatePage() {
  const [mode, setMode] = useState<typeof modes[number]['id']>('redesign')
  const [input1, setInput1] = useState<File | null>(null)
  const [input2, setInput2] = useState<File | null>(null)
  const [prompt, setPrompt] = useState('')
  const [roomType, setRoomType] = useState('')
  const [style, setStyle] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:2' | '2:3'>('1:1')
  const [quality, setQuality] = useState<'auto' | 'low' | 'medium' | 'high'>('auto')
  const [variants, setVariants] = useState(2)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  
  const handleGenerate = async () => {
    // Validate inputs
    if (mode === 'imagine' && !prompt) {
      toast({
        title: 'Prompt required',
        description: 'Please enter a description for Imagine mode',
        variant: 'destructive'
      })
      return
    }
    
    if (['redesign', 'staging'].includes(mode) && !input1) {
      toast({
        title: 'Image required',
        description: 'Please upload an image',
        variant: 'destructive'
      })
      return
    }
    
    if (mode === 'compose' && (!input1 || !input2)) {
      toast({
        title: 'Two images required',
        description: 'Please upload both base and reference images',
        variant: 'destructive'
      })
      return
    }
    
    setIsGenerating(true)
    setResults(null)
    
    try {
      // Build form data
      const formData = new FormData()
      formData.append('mode', mode)
      if (prompt) formData.append('prompt', prompt)
      if (roomType) formData.append('roomType', roomType)
      if (style) formData.append('style', style)
      formData.append('aspectRatio', aspectRatio)
      formData.append('quality', quality)
      formData.append('variants', variants.toString())
      if (input1) formData.append('input1', input1)
      if (input2) formData.append('input2', input2)
      
      // Submit generation
      const response = await fetch('/api/v1/generations', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Generation failed')
      }
      
      setJobId(data.data.id)
      
      // Poll for results
      pollForResults(data.data.id)
      
    } catch (error) {
      console.error('Generation error:', error)
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
      setIsGenerating(false)
    }
  }
  
  const pollForResults = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/generations/${id}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const job = data.data
          
          if (job.status === 'succeeded') {
            clearInterval(pollInterval)
            setResults(job)
            setIsGenerating(false)
            toast({
              title: 'Generation complete!',
              description: 'Your designs are ready'
            })
          } else if (job.status === 'failed') {
            clearInterval(pollInterval)
            setIsGenerating(false)
            toast({
              title: 'Generation failed',
              description: job.error || 'Please try again',
              variant: 'destructive'
            })
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)
    
    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setIsGenerating(false)
    }, 600000)
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-foreground mb-2">
          Create Interior Design
        </h1>
        <p className="text-muted-foreground">
          Transform your space with AI-powered design
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode selector */}
          <Card className="p-6">
            <Label className="text-base font-medium mb-4 block">
              Generation Mode
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                    mode === m.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <m.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {modes.find(m => m.id === mode)?.description}
            </p>
          </Card>
          
          {/* Image inputs */}
          {mode !== 'imagine' && (
            <Card className="p-6">
              <Label className="text-base font-medium mb-4 block">
                {mode === 'compose' ? 'Upload Images' : 'Upload Room Photo'}
              </Label>
              
              <div className={cn(
                'grid gap-4',
                mode === 'compose' ? 'md:grid-cols-2' : ''
              )}>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    {mode === 'compose' ? 'Base Room' : 'Room Image'}
                  </Label>
                  <ImageDropzone
                    value={input1}
                    onChange={setInput1}
                    accept="image/jpeg,image/png,image/webp"
                  />
                </div>
                
                {mode === 'compose' && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      Reference / Style Image
                    </Label>
                    <ImageDropzone
                      value={input2}
                      onChange={setInput2}
                      accept="image/jpeg,image/png,image/webp"
                    />
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* Presets */}
          <Card className="p-6">
            <Label className="text-base font-medium mb-4 block">
              Design Preferences
            </Label>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="roomType" className="text-sm mb-2 block">
                  Room Type
                </Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger id="roomType">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {runtimeConfig.presets.roomTypes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.id}>
                        {rt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="style" className="text-sm mb-2 block">
                  Style
                </Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {runtimeConfig.presets.styles.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Prompt */}
            <div className="mt-4">
              <Label htmlFor="prompt" className="text-sm mb-2 block">
                Additional Instructions {mode === 'imagine' && '(Required)'}
              </Label>
              <Textarea
                id="prompt"
                placeholder={
                  mode === 'imagine'
                    ? 'Describe the interior you want to create...'
                    : 'Any specific requirements? (optional)'
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                required={mode === 'imagine'}
              />
            </div>
          </Card>
        </div>
        
        {/* Right: Settings & Generate */}
        <div className="space-y-6">
          {/* Settings */}
          <Card className="p-6">
            <Label className="text-base font-medium mb-4 block">
              Output Settings
            </Label>
            
            <div className="space-y-4">
              {/* Aspect Ratio */}
              <div>
                <Label className="text-sm mb-2 block">
                  Aspect Ratio
                </Label>
                <RadioGroup value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1:1" id="r1" />
                    <Label htmlFor="r1">Square (1:1)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3:2" id="r2" />
                    <Label htmlFor="r2">Landscape (3:2)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2:3" id="r3" />
                    <Label htmlFor="r3">Portrait (2:3)</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Quality */}
              <div>
                <Label className="text-sm mb-2 block">
                  Quality
                </Label>
                <Select value={quality} onValueChange={(v: any) => setQuality(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="low">Low (Fast)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High (Slow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Variants */}
              <div>
                <Label className="text-sm mb-2 block">
                  Number of Variants: {variants}
                </Label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={variants}
                  onChange={(e) => setVariants(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </Card>
          
          {/* Generate button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Design
              </>
            )}
          </Button>
          
          {/* Usage info */}
          <Card className="p-4 bg-muted/50">
            <UsageInfo />
          </Card>
        </div>
      </div>
      
      {/* Progress or Results */}
      {isGenerating && jobId && (
        <GenerationProgress jobId={jobId} />
      )}
      
      {results && (
        <GenerationResult
          result={results}
          onSaveToFavorites={async (renderId) => {
            // Call API to save to favorites
            try {
              const response = await fetch('/api/v1/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ renderId })
              })
              
              if (response.ok) {
                toast({
                  title: 'Added to favorites',
                  description: 'Image saved to My Favorites collection'
                })
              }
            } catch (error) {
              console.error('Failed to save to favorites:', error)
            }
          }}
        />
      )}
    </div>
  )
}

// Helper component for usage info
function UsageInfo() {
  // This would fetch from API
  return (
    <div className="text-sm">
      <div className="font-medium mb-1">Usage This Month</div>
      <div className="text-muted-foreground">
        -- / -- generations remaining
      </div>
    </div>
  )
}
```

### Create Supporting Components

Location: `components/dashboard/ImageDropzone.tsx`
```typescript
'use client'

import { useCallback, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/libs/utils'

interface ImageDropzoneProps {
  value: File | null
  onChange: (file: File | null) => void
  accept?: string
  className?: string
}

export function ImageDropzone({
  value,
  onChange,
  accept = 'image/*',
  className
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      onChange(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }, [onChange])
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }
  
  const handleRemove = () => {
    onChange(null)
    setPreview(null)
  }
  
  return (
    <div className={cn('relative', className)}>
      {preview ? (
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            'flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">
            Drop image here or click to browse
          </span>
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
```

---

## Task 6.3: Additional Pages

Due to length constraints, here are the key additional pages to implement:

### My Renders Page
Location: `app/(app)/dashboard/renders/page.tsx`
- Grid layout with filtering
- Lazy loading images
- Click to view details
- Actions: Save to collection, Download, Delete

### Collections Page
Location: `app/(app)/dashboard/collections/page.tsx`
- List all collections
- Create new collection
- Default "My Favorites" always shown first
- Click to view collection items

### Community Page
Location: `app/(app)/dashboard/community/page.tsx`
- Featured collections
- Grid of inspirations
- "Try this look" button to prefill Create page

### Settings Page
Location: `app/(app)/dashboard/settings/page.tsx`
- Profile information
- Plan details
- Billing management (Stripe portal link)
- Support contact

---

## Mobile Responsiveness

### Key Responsive Patterns
```css
/* Mobile-first approach */
.container {
  @apply px-4 sm:px-6 lg:px-8;
}

.grid-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
}

/* Sticky mobile CTAs */
.mobile-sticky-cta {
  @apply fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:relative lg:p-0 lg:border-0;
}
```

---

## Success Criteria
- [ ] Dashboard layout with sidebar navigation
- [ ] Create page supports all 4 modes
- [ ] File upload with preview works
- [ ] Generation flow completes end-to-end
- [ ] Results display with save actions
- [ ] Collections management works
- [ ] Mobile responsive on all screens
- [ ] Theme v2 design tokens applied

---

## Next Phase Preview
Phase 7 will complete:
- Testing implementation
- Performance optimization
- Error handling
- Final polish
- Documentation

Ensure all UI flows work before final testing phase.