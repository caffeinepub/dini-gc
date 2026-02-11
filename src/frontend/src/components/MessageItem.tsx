import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import type { Message } from '../backend';
import { usePictureUrl, useUserProfile, useEmojiById } from '../hooks/useQueries';

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
}

export default function MessageItem({ message, isOwnMessage }: MessageItemProps) {
  const { data: userProfile } = useUserProfile(message.userId);
  const { data: pictureUrl } = usePictureUrl(userProfile?.profilePictureId || '');

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today at ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return `${dateStr} at ${timeStr}`;
  };

  const usernameColor = userProfile?.usernameColor || '#cde5aa';
  const displayUsername = userProfile?.username || message.userId;

  // Generate letter avatar with #cde5aa background and white text
  const renderLetterAvatar = () => {
    return (
      <div 
        className="w-full h-full rounded-full flex items-center justify-center font-semibold text-sm"
        style={{ backgroundColor: '#cde5aa', color: '#ffffff' }}
      >
        {displayUsername[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="w-10 h-10 ring-2 ring-primary flex-shrink-0">
        {pictureUrl && userProfile?.profilePictureId ? (
          <AvatarImage src={pictureUrl} alt={displayUsername} />
        ) : null}
        <AvatarFallback className="bg-transparent">
          {renderLetterAvatar()}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`flex items-baseline gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-sm font-semibold" style={{ color: usernameColor }}>
            {displayUsername}
          </span>
          <span className="text-xs text-primary">{formatTimestamp(message.timestamp)}</span>
        </div>

        <Card
          className={`overflow-hidden border-primary ${
            isOwnMessage
              ? 'text-white'
              : 'bg-card'
          }`}
          style={isOwnMessage ? { backgroundColor: '#cde5aa' } : {}}
        >
          {/* Text content */}
          {message.content && (
            <p className="px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {/* Custom Emojis */}
          {message.customEmojis && message.customEmojis.length > 0 && (
            <div className={`${message.content ? 'border-t' : ''} ${isOwnMessage ? 'border-white/20' : 'border-primary'} p-2`}>
              <div className="flex flex-wrap gap-2">
                {message.customEmojis.map((emojiId) => (
                  <EmojiDisplay key={emojiId} emojiId={emojiId} />
                ))}
              </div>
            </div>
          )}

          {/* Media files */}
          {message.mediaFiles && message.mediaFiles.length > 0 && (
            <div className={`${message.content || (message.customEmojis && message.customEmojis.length > 0) ? 'border-t' : ''} ${isOwnMessage ? 'border-white/20' : 'border-primary'}`}>
              <div className="p-2 space-y-2">
                {message.mediaFiles.map((media) => {
                  const mediaUrl = media.blob.getDirectURL();
                  
                  if (media.mediaType === 'image' || media.mediaType === 'gif') {
                    return (
                      <div key={media.id.toString()} className="rounded-lg overflow-hidden">
                        <img
                          src={mediaUrl}
                          alt={media.fileName}
                          className="max-w-full h-auto max-h-96 object-contain rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    );
                  }
                  
                  if (media.mediaType === 'video') {
                    return (
                      <div key={media.id.toString()} className="rounded-lg overflow-hidden">
                        <video
                          src={mediaUrl}
                          controls
                          className="max-w-full h-auto max-h-96 rounded-lg"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function EmojiDisplay({ emojiId }: { emojiId: string }) {
  const { data: emoji } = useEmojiById(emojiId);

  if (!emoji) {
    return <span className="text-xs text-primary">:{emojiId}:</span>;
  }

  return (
    <img
      src={emoji.blob.getDirectURL()}
      alt={emoji.name}
      title={emoji.name}
      className="w-8 h-8 object-contain inline-block"
    />
  );
}
