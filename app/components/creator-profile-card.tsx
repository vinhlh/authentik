import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CreatorProfileCardProps {
  name: string
  bio?: string
  avatar?: string
  isVerified?: boolean
  collectionCount?: number
}

export function CreatorProfileCard({
  name,
  bio,
  avatar,
  isVerified = false,
  collectionCount = 0,
}: CreatorProfileCardProps) {
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-16 h-16">
            {avatar && <AvatarImage src={avatar} alt={name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          {/* Creator Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{name}</h3>
              {isVerified && (
                <Badge variant="secondary" className="bg-accent-green text-white">
                  ✓ Verified Local
                </Badge>
              )}
            </div>

            {bio && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {bio}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {collectionCount} {collectionCount === 1 ? 'collection' : 'collections'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
