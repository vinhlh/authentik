'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Video } from 'lucide-react'

export default function AdminPage() {
  const [url, setUrl] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<import('@/lib/extraction-pipeline').ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (!url) {
      setError('Please enter a video URL')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, creatorName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed')
      }

      setResult(data)
      setUrl('')
      setCreatorName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Content Management</h1>
        <p className="text-muted-foreground">
          Extract restaurant data from YouTube and TikTok videos
        </p>
      </div>

      {/* Extraction Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Extract from Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Video URL
            </label>
            <Input
              placeholder="https://youtube.com/watch?v=... or https://tiktok.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Creator Name
            </label>
            <Input
              placeholder="e.g., Vinh Le, Food Explorer"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleExtract}
            disabled={loading || !url}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Restaurants'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">
                  Extraction Failed
                </h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Result */}
      {result && (
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-6">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-500 mb-1">
                  Extraction Complete!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {result.collection.name}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-2xl font-bold">
                      {result.stats.totalMentions}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Mentions
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {result.stats.verified}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Verified
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.stats.imported}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Imported
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600">
                      {result.stats.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Failed
                    </div>
                  </div>
                </div>

                {/* View Collection Button */}
                <div className="mt-6">
                  <Button
                    onClick={() => window.location.href = `/collections/${result.collection.id}`}
                    variant="outline"
                    className="w-full"
                  >
                    View Collection
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Find a Food Review Video</h3>
            <p className="text-sm text-muted-foreground">
              Search YouTube or TikTok for Da Nang food reviews. Look for videos
              that mention specific restaurant names and locations.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Enter Video URL</h3>
            <p className="text-sm text-muted-foreground">
              Copy the video URL and paste it above. Supports YouTube and TikTok.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Add Creator Name</h3>
            <p className="text-sm text-muted-foreground">
              Enter the creator&apos;s name for attribution in the collection.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. Extract & Verify</h3>
            <p className="text-sm text-muted-foreground">
              The system will extract restaurant mentions, verify them with Google
              Places, classify them as Local Favorite or Tourist Spot, and import
              them to your database.
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Supported Platforms</h3>
            <div className="flex gap-2">
              <Badge>YouTube</Badge>
              <Badge>TikTok</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
