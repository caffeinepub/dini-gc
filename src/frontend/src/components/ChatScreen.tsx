import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMessages, useSendMessage, usePictureUrl } from '../hooks/useQueries';
import type { UserProfile } from '../App';
import MessageItem from './MessageItem';
import SettingsDialog from './SettingsDialog';

interface ChatScreenProps {
  userProfile: UserProfile;
  onLeave: () => void;
}

export default function ChatScreen({ userProfile, onLeave }: ChatScreenProps) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(userProfile);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: messagesLoading } = useMessages();
  const { data: userAvatarUrl } = usePictureUrl(currentProfile.pictureId);
  const sendMutation = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      return;
    }

    setIsSending(true);

    try {
      await sendMutation.mutateAsync({
        content: messageText.trim(),
        userId: currentProfile.userId,
        mediaFileIds: [],
        customEmojis: [],
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProfileUpdate = (username: string, pictureId: string, usernameColor: string) => {
    const updatedProfile = {
      ...currentProfile,
      username,
      pictureId,
      usernameColor,
    };
    setCurrentProfile(updatedProfile);
    sessionStorage.setItem('chatUserProfile', JSON.stringify(updatedProfile));
  };

  const renderLetterAvatar = (username: string, color: string) => {
    if (!username) return null;
    return (
      <div 
        className="w-full h-full rounded-full flex items-center justify-center font-bold"
        style={{ backgroundColor: color, color: '#ffffff' }}
      >
        {username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-primary shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#cde5aa' }}>Dini GC</h1>
                <p className="text-xs text-muted-foreground">Group Chat</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 ring-2 ring-primary">
                  {userAvatarUrl ? (
                    <AvatarImage src={userAvatarUrl} alt={currentProfile.username} />
                  ) : null}
                  <AvatarFallback className="bg-transparent">
                    {renderLetterAvatar(currentProfile.username, currentProfile.usernameColor)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline" style={{ color: currentProfile.usernameColor }}>
                  {currentProfile.username}
                </span>
              </div>
              
              <SettingsDialog 
                userProfile={currentProfile}
                onProfileUpdate={handleProfileUpdate}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={onLeave}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="container mx-auto max-w-4xl py-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageItem
                  key={message.id.toString()}
                  message={message}
                  isOwnMessage={message.userId === currentProfile.userId}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-card border-t border-primary shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="flex-1 border-primary focus-visible:ring-primary"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !messageText.trim()}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-2">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} · Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'dinigc'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
