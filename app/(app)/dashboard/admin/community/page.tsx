'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type AdminItem = { id: string; image_url: string; title?: string }

export default function AdminCommunityPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<AdminItem[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/community/collections/community/items')
      const result = await res.json()
      
      if (result.success) {
        const mapped: AdminItem[] = (result.data.items || []).map((i: any) => ({ id: i.id, image_url: i.image_url, title: i.title }))
        setItems(mapped)
        setSelected({})
      }
    } catch (error) {
      console.error('Failed to load items:', error)
    }
  }, [])

  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/admin/ensure', { method: 'POST' })
      const result = await res.json()
      
      if (result.success && result.data.isAdmin) {
        setIsAdmin(true)
        loadItems()
      }
    } catch (error) {
      console.error('Admin check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loadItems])

  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  const handleEnsureAdmin = async () => {
    setIsLoading(true)
    await checkAdminStatus()
  }

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files || [])
    if (list.length === 0) return
    const form = new FormData()
    list.forEach((f) => form.append('files', f))
    setUploading(true)
    setUploadError(null)
    setUploadStatus(`Uploading ${list.length} file${list.length > 1 ? 's' : ''}…`)
    try {
      const res = await fetch('/api/v1/admin/community/images/upload', { method: 'POST', body: form })
      const result = await res.json()
      if (result.success) {
        setUploadStatus(`Uploaded ${result.data.items?.length ?? list.length} file${list.length > 1 ? 's' : ''}`)
        await loadItems()
      } else {
        setUploadError(result?.error?.message || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload failed', err)
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadStatus(''), 1200)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    await uploadFiles(e.target.files)
  }

  const onChooseFiles = () => fileInputRef.current?.click()

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (ev) => {
    ev.preventDefault()
    ev.stopPropagation()
    if (ev.dataTransfer?.files?.length) {
      await uploadFiles(ev.dataTransfer.files)
    }
  }

  const handleDelete = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([id]) => id)
    if (ids.length === 0) return
    try {
      const res = await fetch('/api/v1/admin/community/images/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      const result = await res.json()
      if (result.success) {
        await loadItems()
      }
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              You need admin privileges to manage community content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleEnsureAdmin}>
              Request Admin Access
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Community Admin</h1>
          <p className="text-muted-foreground">Upload images and manage the public inspiration feed.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={loadItems} disabled={uploading}>Refresh</Button>
          <Button onClick={onChooseFiles} disabled={uploading}>Upload Images</Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,image/gif"
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={handleDrop}
        className="rounded-lg border border-border bg-card text-card-foreground p-6 flex items-center justify-between gap-6"
      >
        <div>
          <div className="font-medium">Drag & drop images here</div>
          <div className="text-sm text-muted-foreground">Supported: JPG, PNG, WEBP, AVIF, GIF • Max 15MB each</div>
        </div>
        <Button variant="secondary" onClick={onChooseFiles} disabled={uploading}>Choose files</Button>
      </div>

      {/* Upload feedback */}
      {(uploading || uploadStatus || uploadError) && (
        <div className="text-sm text-muted-foreground px-1">
          {uploading && <span>{uploadStatus}</span>}
          {!uploading && uploadStatus && <span>{uploadStatus}</span>}
          {uploadError && <span className="text-destructive ml-2">{uploadError}</span>}
        </div>
      )}
      <Separator />

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {Object.values(selected).some(Boolean) ? `${Object.values(selected).filter(Boolean).length} selected` : `${items.length} items`}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={!Object.values(selected).some(Boolean)}>
            Delete Selected
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <Card key={it.id} className="overflow-hidden group">
            <div className="relative w-full aspect-square">
              <Image src={it.image_url} alt={it.title || 'Image'} fill className="object-cover" />
              <button
                type="button"
                aria-label={selected[it.id] ? 'Deselect' : 'Select'}
                onClick={() => setSelected((s) => ({ ...s, [it.id]: !s[it.id] }))}
                className="absolute top-2 left-2 h-6 w-6 rounded-md border border-border bg-background/80 backdrop-blur text-foreground flex items-center justify-center"
              >
                <span className="text-xs">{selected[it.id] ? '✓' : ''}</span>
              </button>
            </div>
            <CardContent className="p-3">
              <div className="text-xs truncate" title={it.title || it.id}>{it.title || it.id}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No images uploaded yet.</p>
        </div>
      )}
    </div>
  )
}
