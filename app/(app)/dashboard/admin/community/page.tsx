'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const form = new FormData()
    const filesArray = Array.from(files)
    filesArray.forEach((f) => form.append('files', f))
    setUploading(true)
    setUploadError(null)
    setUploadStatus(`Uploading ${filesArray.length} file${filesArray.length > 1 ? 's' : ''}…`)
    try {
      const res = await fetch('/api/v1/admin/community/images/upload', { method: 'POST', body: form })
      const result = await res.json()
      if (result.success) {
        setUploadStatus(`Uploaded ${result.data.items?.length ?? filesArray.length} file${filesArray.length > 1 ? 's' : ''}`)
        await loadItems()
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Community Management</h1>
          <p className="text-muted-foreground">
            Manage collections and curated content for the community gallery.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleUpload} disabled={uploading} />
          <Button variant="destructive" onClick={handleDelete} disabled={Object.values(selected).every(v => !v)}>
            Delete Selected
          </Button>
        </div>
      </div>

      {/* Upload feedback */}
      {(uploading || uploadStatus || uploadError) && (
        <div className="text-sm text-muted-foreground px-1">
          {uploading && <span>{uploadStatus}</span>}
          {!uploading && uploadStatus && <span>{uploadStatus}</span>}
          {uploadError && <span className="text-destructive ml-2">{uploadError}</span>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <Card key={it.id} className="overflow-hidden">
            <div className="relative w-full aspect-square">
              <Image src={it.image_url} alt={it.title || 'Image'} fill className="object-cover" />
            </div>
            <CardContent className="flex items-center justify-between p-3">
              <div className="text-xs truncate max-w-[70%]">{it.title || it.id}</div>
              <input
                type="checkbox"
                checked={!!selected[it.id]}
                onChange={(e) => setSelected((s) => ({ ...s, [it.id]: e.target.checked }))}
              />
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
