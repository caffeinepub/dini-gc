import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Loader2, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateUser, useUploadProfilePicture } from '../hooks/useQueries';
import { toast } from 'sonner';

interface JoinScreenProps {
  onJoin: (userId: string, username: string, pictureId: string, usernameColor: string) => void;
}

export default function JoinScreen({ onJoin }: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createUserMutation = useCreateUser();
  const uploadProfilePictureMutation = useUploadProfilePicture();

  const isJoining = createUserMutation.isPending || uploadProfilePictureMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoin = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      let pictureId = '';

      if (uploadedFile) {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        pictureId = `custom_${username}_${Date.now()}`;
        await uploadProfilePictureMutation.mutateAsync({ bytes, pictureId });
      }

      const userId = await createUserMutation.mutateAsync({
        username: username.trim(),
        profilePictureId: pictureId,
        usernameColor: '#cde5aa',
      });

      onJoin(userId, username.trim(), pictureId, '#cde5aa');
    } catch (error: any) {
      console.error('Join error:', error);
      
      let errorMessage = 'Failed to join. Please try again.';
      
      if (error?.message === 'USERNAME_TAKEN') {
        errorMessage = 'Sorry, this username already exists. Please choose a different username.';
      } else if (error?.message === 'UNAUTHORIZED') {
        errorMessage = 'You are not authorized to join. Please try again.';
      } else if (error?.message === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isJoining) {
      handleJoin();
    }
  };

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#cde5aa' }}>
            Dini GC
          </h1>
          <p className="text-muted-foreground">Join the conversation</p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-8 border-2 border-primary">
          <div className="space-y-6">
            {/* Dinosaur Image */}
            <div className="flex justify-center mb-6">
              <img 
                src="/assets/image.png" 
                alt="Dinosaur" 
                className="w-32 h-32 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            {/* Username Input */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Choose your username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={30}
                disabled={isJoining}
                className="border-primary focus-visible:ring-primary"
              />
            </div>

            {/* Avatar Preview and Upload */}
            <div className="space-y-2">
              <Label className="text-foreground">Profile Picture (Optional)</Label>
              
              <div className="flex justify-center mb-4">
                <div className="text-center">
                  <Avatar className="w-24 h-24 ring-4 ring-primary shadow-lg mx-auto mb-2">
                    {uploadedPreview ? (
                      <AvatarImage src={uploadedPreview} alt="Uploaded" />
                    ) : null}
                    <AvatarFallback className="bg-transparent">
                      {renderLetterAvatar(username || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground">Your avatar preview</p>
                </div>
              </div>

              {uploadedPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadedPreview('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isJoining}
                  className="w-full mb-2 border-primary text-primary hover:bg-primary/10"
                >
                  Remove Picture
                </Button>
              )}

              <div>
                <Label
                  htmlFor="avatar-upload"
                  className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    isJoining ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary">
                    {uploadedFile ? uploadedFile.name : 'Upload Profile Picture'}
                  </span>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isJoining}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>
            </div>

            {createUserMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createUserMutation.error?.message === 'USERNAME_TAKEN' 
                    ? 'Sorry, this username already exists. Please choose a different username.'
                    : createUserMutation.error?.message === 'UNAUTHORIZED'
                    ? 'You are not authorized to join. Please try again.'
                    : createUserMutation.error?.message === 'NETWORK_ERROR'
                    ? 'Network error. Please check your connection and try again.'
                    : createUserMutation.error?.message || 'Failed to join. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleJoin}
              disabled={isJoining || !username.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white text-lg py-6"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Chat'
              )}
            </Button>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
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
        </footer>
      </div>
    </div>
  );
}
