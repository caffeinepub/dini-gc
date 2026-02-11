import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadProfilePicture, useCreateUser } from '../hooks/useQueries';
import type { UserProfile } from '../App';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JoinScreenProps {
  onJoin: (profile: UserProfile) => void;
}

const DEFAULT_USERNAME_COLOR = '#cde5aa';

export default function JoinScreen({ onJoin }: JoinScreenProps) {
  const [username, setUsername] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  const uploadMutation = useUploadProfilePicture();
  const createUserMutation = useCreateUser();

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

    setIsJoining(true);
    setConnectionError(false);

    try {
      let pictureId = '';

      // If user uploaded a custom picture, upload it first
      if (uploadedFile) {
        try {
          const arrayBuffer = await uploadedFile.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          pictureId = `custom_${username.trim()}_${Date.now()}`;
          await uploadMutation.mutateAsync({ bytes, pictureId });
        } catch (uploadError: any) {
          console.error('Error uploading profile picture:', uploadError);
          // Continue with join even if picture upload fails
          toast.warning('Profile picture upload failed, continuing with letter avatar');
          pictureId = '';
        }
      }

      // Create user in backend - pictureId can be empty string if no picture selected
      const userId = await createUserMutation.mutateAsync({
        username: username.trim(),
        profilePictureId: pictureId,
        usernameColor: DEFAULT_USERNAME_COLOR,
      });

      // Successfully joined
      onJoin({ 
        userId,
        username: username.trim(), 
        pictureId,
        usernameColor: DEFAULT_USERNAME_COLOR,
      });
      
      toast.success('Welcome to Dini GC! 🦖');
    } catch (error: any) {
      console.error('Error joining chat:', error);
      
      const errorMessage = error?.message || String(error);
      
      // Handle specific error types
      if (errorMessage === 'USERNAME_TAKEN') {
        toast.error('This username is already taken. Please choose a different username.');
      } else if (errorMessage === 'PRINCIPAL_USERNAME_MISMATCH') {
        toast.error('You already have a different username. Please use your existing username or clear your session.');
      } else if (errorMessage === 'UNAUTHORIZED') {
        toast.error('Authentication error. Please refresh the page and try again.');
      } else if (errorMessage === 'NETWORK_ERROR' || errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setConnectionError(true);
        toast.error('Network error. Please check your connection and try again.');
      } else if (errorMessage === 'Backend not initialized') {
        setConnectionError(true);
        toast.error('Unable to connect to the chat service. Please wait a moment and try again.');
      } else {
        // Generic error for unexpected issues
        console.error('Unexpected join error:', error);
        toast.error('An unexpected error occurred. Please try again.');
      }
      
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <Card className="w-full max-w-2xl shadow-2xl border-[22px] border-primary">
        <CardHeader className="text-center space-y-2">
          {/* Dinosaur Image */}
          <div className="flex justify-center mb-3">
            <img 
              src="/assets/image.png" 
              alt="Dini Dinosaur" 
              className="h-16 w-auto object-contain sm:h-20"
            />
          </div>
          
          <CardTitle className="text-3xl font-bold" style={{ backgroundColor: '#cde5aa', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'inline-block' }}>
            Join the Dini GC
          </CardTitle>
          <CardDescription className="text-base text-primary">
            Fun is starting. 🦖❤
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Error Alert */}
          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to connect to the backend. Please check your internet connection and try again in a moment.
              </AlertDescription>
            </Alert>
          )}

          {/* Username Input */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-base font-medium text-primary">
              Choose a Username
            </Label>
            <Input
              id="username"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              className="text-base h-12 border-primary focus-visible:ring-primary"
              disabled={isJoining}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isJoining) {
                  handleJoin();
                }
              }}
            />
            <p className="text-xs text-primary">
              Returning users can reuse their previous username
            </p>
          </div>

          {/* Avatar Selection - Only label, upload button, and note text visible */}
          <div className="space-y-3">
            <Label className="text-base font-medium text-primary">Select Profile Picture (Optional)</Label>

            {/* Upload Custom Avatar */}
            <Label
              htmlFor="avatar-upload"
              className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                isJoining ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {uploadedFile ? uploadedFile.name : 'Upload Custom Picture'}
              </span>
            </Label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isJoining}
              className="hidden"
            />
            
            <p className="text-xs text-primary text-center">
              If no picture is selected, a letter avatar will be generated automatically
            </p>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoin}
            disabled={isJoining || !username.trim()}
            className="w-full h-12 text-base font-semibold text-white bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join the Fun.'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
