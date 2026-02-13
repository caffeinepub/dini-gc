import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { usePictureUrl, useUserProfile } from '../hooks/useQueries';
import type { Message } from '../backend';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const { data: userProfile } = useUserProfile(message.userId);
  const { data: avatarUrl } = usePictureUrl(userProfile?.profilePictureId || '');

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderLetterAvatar = (username: string, color: string) => {
    if (!username) return null;
    return (
      <div 
        className="w-full h-full rounded-full flex items-center justify-center font-bold"
        style={{ backgroundColor: color || '#cde5aa', color: '#ffffff' }}
      >
        {username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="w-10 h-10 ring-2 ring-primary shrink-0">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={userProfile?.username || message.userId} />
        ) : null}
        <AvatarFallback className="bg-transparent">
          {renderLetterAvatar(
            userProfile?.username || message.userId,
            userProfile?.usernameColor || '#cde5aa'
          )}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="text-sm font-semibold"
            style={{ color: userProfile?.usernameColor || '#cde5aa' }}
          >
            {userProfile?.username || message.userId}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        <Card className={`p-3 ${isOwnMessage ? 'bg-primary/10' : 'bg-card'} border-primary`}>
          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
