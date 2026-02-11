import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, LogOut, Users, Paperclip, Image as ImageIcon, Video, Smile, Loader2, AlertCircle, RefreshCw, Settings, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useMessages, useSendMessage, useMessageCount, useUploadMedia, usePictureUrl, useUpdateUserProfile, useUploadProfilePicture, useDefaultPictures, useAllEmojis } from '../hooks/useQueries';
import type { UserProfile } from '../App';
import type { MediaType } from '../backend';
import MessageItem from './MessageItem';
import GifPicker from './GifPicker';
import EmojiPicker from './EmojiPicker';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatScreenProps {
  userProfile: UserProfile;
  onLeave: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

export default function ChatScreen({ userProfile, onLeave, onProfileUpdate }: ChatScreenProps) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  
  // Profile edit state
  const [editUsername, setEditUsername] = useState(userProfile.username);
  const [editColor, setEditColor] = useState(userProfile.usernameColor);
  const [editPictureId, setEditPictureId] = useState(userProfile.pictureId);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], refetch, isLoading: messagesLoading, isError: messagesError } = useMessages();
  const { data: messageCount = BigInt(0) } = useMessageCount();
  const { data: userAvatarUrl } = usePictureUrl(userProfile.pictureId);
  const { data: defaultPictures = [] } = useDefaultPictures();
  const sendMutation = useSendMessage();
  const uploadMediaMutation = useUploadMedia();
  const updateProfileMutation = useUpdateUserProfile();
  const uploadProfilePictureMutation = useUploadProfilePicture();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not a valid image or video file`);
        return false;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    setIsSending(true);

    try {
      const response = await fetch(gifUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch GIF');
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const mediaId = await uploadMediaMutation.mutateAsync({
        bytes,
        mediaType: 'gif' as MediaType,
        fileName: 'giphy.gif',
      });

      await sendMutation.mutateAsync({
        content: messageText.trim(),
        userId: userProfile.userId,
        mediaFileIds: [mediaId],
        customEmojis: selectedEmojis,
      });

      setMessageText('');
      setSelectedEmojis([]);
      toast.success('GIF sent successfully!');
    } catch (error) {
      console.error('Error sending GIF:', error);
      toast.error('Failed to send GIF. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiSelect = (emojiId: string) => {
    setSelectedEmojis(prev => [...prev, emojiId]);
  };

  const removeEmoji = (index: number) => {
    setSelectedEmojis(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0 && selectedEmojis.length === 0) {
      return;
    }

    setIsSending(true);

    try {
      const mediaFileIds: bigint[] = [];

      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        const mediaType: MediaType = file.type.startsWith('image/') 
          ? 'image' as MediaType
          : 'video' as MediaType;

        const mediaId = await uploadMediaMutation.mutateAsync({
          bytes,
          mediaType,
          fileName: file.name,
        });

        mediaFileIds.push(mediaId);
      }

      await sendMutation.mutateAsync({
        content: messageText.trim(),
        userId: userProfile.userId,
        mediaFileIds,
        customEmojis: selectedEmojis,
      });

      setMessageText('');
      setSelectedFiles([]);
      setSelectedEmojis([]);
      toast.success('Message sent!');
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

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be smaller than 5MB');
        return;
      }
      setUploadedFile(file);
      setEditPictureId('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    setIsSavingProfile(true);

    try {
      let pictureId = editPictureId;

      if (uploadedFile) {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        pictureId = `custom_${editUsername}_${Date.now()}`;
        await uploadProfilePictureMutation.mutateAsync({ bytes, pictureId });
      }

      await updateProfileMutation.mutateAsync({
        userId: userProfile.userId,
        username: editUsername.trim(),
        profilePictureId: pictureId,
        usernameColor: editColor,
      });

      const updatedProfile: UserProfile = {
        userId: userProfile.userId,
        username: editUsername.trim(),
        pictureId,
        usernameColor: editColor,
      };

      onProfileUpdate(updatedProfile);
      setShowProfileDialog(false);
      setUploadedFile(null);
      setUploadedPreview('');
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Generate letter avatar with #cde5aa background and white text
  const renderLetterAvatar = (username: string) => {
    if (!username) return null;
    return (
      <div 
        className="w-full h-full rounded-full flex items-center justify-center font-bold"
        style={{ backgroundColor: '#cde5aa', color: '#ffffff' }}
      >
        {username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-primary bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ backgroundColor: '#cde5aa', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', display: 'inline-block' }}>
                Dini GC
              </h1>
              <p className="text-xs flex items-center gap-1 mt-1 text-primary">
                <Users className="w-3 h-3" />
                {Number(messageCount)} messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(205, 229, 170, 0.2)' }}>
              <Avatar className="w-7 h-7">
                {userAvatarUrl && userProfile.pictureId ? (
                  <AvatarImage src={userAvatarUrl} />
                ) : null}
                <AvatarFallback className="bg-transparent">
                  {renderLetterAvatar(userProfile.username)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-primary">
                {userProfile.username}
              </span>
            </div>
            <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Edit Profile">
                  <Settings className="w-5 h-5 text-primary" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-primary">Edit Profile</DialogTitle>
                  <DialogDescription className="text-primary">
                    Update your username, profile picture, and username color
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-username" className="text-primary">Username</Label>
                    <Input
                      id="edit-username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      maxLength={30}
                      disabled={isSavingProfile}
                      className="border-primary focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-color" className="text-primary">Username Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-color"
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        disabled={isSavingProfile}
                        className="w-20 h-10 cursor-pointer border-primary"
                      />
                      <Input
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        disabled={isSavingProfile}
                        className="flex-1 border-primary focus-visible:ring-primary"
                        placeholder="#cde5aa"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary">Profile Picture (Optional)</Label>
                    
                    {/* Preview current selection */}
                    <div className="flex justify-center mb-4">
                      <div className="text-center">
                        <Avatar className="w-20 h-20 ring-4 ring-primary shadow-lg mx-auto mb-2">
                          {uploadedPreview ? (
                            <AvatarImage src={uploadedPreview} alt="Uploaded" />
                          ) : editPictureId ? (
                            <AvatarImage 
                              src={`/assets/generated/${editPictureId}-transparent.dim_64x64.png`}
                              alt={editPictureId} 
                            />
                          ) : null}
                          <AvatarFallback className="bg-transparent">
                            {renderLetterAvatar(editUsername)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-primary">Your avatar preview</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {defaultPictures.map(([pictureId]) => (
                        <button
                          key={pictureId}
                          onClick={() => {
                            setEditPictureId(pictureId);
                            setUploadedFile(null);
                            setUploadedPreview('');
                          }}
                          disabled={isSavingProfile}
                          className={`relative rounded-full transition-all hover:scale-110 disabled:opacity-50 ${
                            editPictureId === pictureId && !uploadedPreview
                              ? 'ring-4 ring-primary shadow-lg scale-110'
                              : 'ring-2 ring-primary'
                          }`}
                        >
                          <Avatar className="w-full h-full">
                            <AvatarImage 
                              src={`/assets/generated/${pictureId}-transparent.dim_64x64.png`}
                              alt={pictureId} 
                            />
                          </Avatar>
                        </button>
                      ))}
                    </div>
                    
                    {/* Clear avatar button */}
                    {(editPictureId || uploadedPreview) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditPictureId('');
                          setUploadedFile(null);
                          setUploadedPreview('');
                        }}
                        disabled={isSavingProfile}
                        className="w-full mb-2 border-primary text-primary hover:bg-primary/10"
                      >
                        Use Letter Avatar
                      </Button>
                    )}
                    
                    <Label
                      htmlFor="profile-avatar-upload"
                      className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                        isSavingProfile ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Palette className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary">
                        {uploadedFile ? uploadedFile.name : 'Upload Custom Picture'}
                      </span>
                    </Label>
                    <Input
                      id="profile-avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileFileChange}
                      disabled={isSavingProfile}
                      className="hidden"
                      ref={profileFileInputRef}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowProfileDialog(false);
                      setEditUsername(userProfile.username);
                      setEditColor(userProfile.usernameColor);
                      setEditPictureId(userProfile.pictureId);
                      setUploadedFile(null);
                      setUploadedPreview('');
                    }}
                    disabled={isSavingProfile}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile}
                    className="text-white bg-primary hover:bg-primary/90"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={onLeave} title="Leave Chat">
              <LogOut className="w-5 h-5 text-primary" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-hidden bg-white">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="container mx-auto px-4 py-6 space-y-4 max-w-4xl">
            {messagesLoading ? (
              <div className="text-center py-12 text-primary">
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-lg font-medium text-primary">Loading messages...</p>
              </div>
            ) : messagesError ? (
              <div className="py-12">
                <Alert variant="destructive" className="max-w-md mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Failed to load messages</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="ml-2 border-primary text-primary"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20 text-primary" />
                <p className="text-lg font-medium text-primary">No messages yet</p>
                <p className="text-sm text-primary">Be the first to say hello!</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageItem
                  key={message.id.toString()}
                  message={message}
                  isOwnMessage={message.userId === userProfile.userId}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Message Input */}
      <footer className="border-t border-primary bg-card shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative group bg-accent rounded-lg p-2 flex items-center gap-2 max-w-xs"
                >
                  {file.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <Video className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <span className="text-xs truncate flex-1 text-primary">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={isSending}
                    className="text-destructive hover:text-destructive/80 text-xs font-medium disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Selected Emojis Preview */}
          {selectedEmojis.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedEmojis.map((emojiId, index) => (
                <div
                  key={index}
                  className="relative group bg-accent rounded-lg p-2 flex items-center gap-2"
                >
                  <span className="text-xs text-primary">Emoji: {emojiId}</span>
                  <button
                    onClick={() => removeEmoji(index)}
                    disabled={isSending}
                    className="text-destructive hover:text-destructive/80 text-xs font-medium disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                title="Attach files"
                className="border-primary hover:bg-primary/10"
              >
                <Paperclip className="w-5 h-5 text-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowGifPicker(!showGifPicker)}
                disabled={isSending}
                title="Send GIF"
                className="border-primary hover:bg-primary/10"
              >
                <ImageIcon className="w-5 h-5 text-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={isSending}
                title="Add custom emoji"
                className="border-primary hover:bg-primary/10"
              >
                <Smile className="w-5 h-5 text-primary" />
              </Button>
            </div>
            <Input
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending}
              className="flex-1 h-12 text-base border-primary focus-visible:ring-primary"
              maxLength={500}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || (!messageText.trim() && selectedFiles.length === 0 && selectedEmojis.length === 0)}
              size="lg"
              className="px-6 text-white bg-primary hover:bg-primary/90"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-primary mt-2 text-center">
            Messages refresh automatically every 1-2 seconds for near-live chat
          </p>
        </div>

        {/* GIF Picker */}
        {showGifPicker && (
          <div className="border-t border-primary">
            <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="border-t border-primary">
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
          </div>
        )}
      </footer>

      {/* Footer Attribution */}
      <div className="border-t border-primary py-2" style={{ backgroundColor: 'rgba(205, 229, 170, 0.1)' }}>
        <div className="container mx-auto px-4 text-center text-xs text-primary">
          © 2025. Built with love using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-medium text-primary"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </div>
  );
}
