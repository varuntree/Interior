'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CommunityCollection {
  id: string
  title: string
  description?: string
  cover_image_url?: string
  is_published: boolean
  position: number
}

export default function AdminCommunityPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [collections, setCollections] = useState<CommunityCollection[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImageUrl: ''
  })

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const res = await fetch('/api/v1/admin/ensure', { method: 'POST' })
      const result = await res.json()
      
      if (result.success && result.data.isAdmin) {
        setIsAdmin(true)
        loadCollections()
      }
    } catch (error) {
      console.error('Admin check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCollections = async () => {
    try {
      const res = await fetch('/api/v1/community/collections')
      const result = await res.json()
      
      if (result.success) {
        setCollections(result.data.collections)
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  const handleEnsureAdmin = async () => {
    setIsLoading(true)
    await checkAdminStatus()
  }

  const handleCreateCollection = async () => {
    try {
      const res = await fetch('/api/v1/admin/community/collections/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await res.json()
      
      if (result.success) {
        setShowCreateForm(false)
        setFormData({ title: '', description: '', coverImageUrl: '' })
        loadCollections()
      }
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  const togglePublished = async (id: string, isPublished: boolean) => {
    try {
      const res = await fetch('/api/v1/admin/community/collections/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublished: !isPublished })
      })
      
      if (res.ok) {
        loadCollections()
      }
    } catch (error) {
      console.error('Failed to toggle published:', error)
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
        <Button onClick={() => setShowCreateForm(true)}>
          Create Collection
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Collection title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Collection description"
              />
            </div>
            <div>
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                value={formData.coverImageUrl}
                onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCollection} disabled={!formData.title}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {collections.map((collection) => (
          <Card key={collection.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{collection.title}</CardTitle>
                  {collection.description && (
                    <CardDescription>{collection.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={collection.is_published ? "default" : "outline"}
                    onClick={() => togglePublished(collection.id, collection.is_published)}
                  >
                    {collection.is_published ? 'Published' : 'Unpublished'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {collection.cover_image_url && (
              <CardContent>
                <img
                  src={collection.cover_image_url}
                  alt={collection.title}
                  className="w-32 h-20 object-cover rounded"
                />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No collections created yet.</p>
        </div>
      )}
    </div>
  )
}