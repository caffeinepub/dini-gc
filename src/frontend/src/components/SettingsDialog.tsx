import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Settings, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateUserProfile, useUploadProfilePicture, usePictureUrl } from '../hooks/useQueries';
import { useTheme } from '../hooks/useTheme';
import type { UserProfile } from '../App';

interface SettingsDialogProps {
  userProfile: UserProfile;
  onProfileUpdate: (username: string, pictureId: string, usernameColor: string) => void;
}

export default function SettingsDialog({ userProfile, onProfileUpdate }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(userProfile.username);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: currentAvatarUrl } = usePictureUrl(userProfile.pictureId);
  const updateProfileMutation = useUpdateUserProfile();
  const uploadProfilePictureMutation = useUploadProfilePicture();
  const { theme, toggleTheme } = useTheme();

  const isUpdating = updateProfileMutation.isPending || uploadProfilePictureMutation.isPending;

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

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      let pictureId = userProfile.pictureId;

      if (uploadedFile) {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        pictureId = `custom_${username}_${Date.now()}`;
        await uploadProfilePictureMutation.mutateAsync({ bytes, pictureId });
      }

      await updateProfileMutation.mutateAsync({
        userId: userProfile.userId,
        username: username.trim(),
        profilePictureId: pictureId,
        usernameColor: userProfile.usernameColor,
      });

      onProfileUpdate(username.trim(), pictureId, userProfile.usernameColor);
      toast.success('Profile updated successfully');
      setOpen(false);
      setUploadedFile(null);
      setUploadedPreview('');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error?.message || 'Failed to update profile. Please try again.');
    }
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary hover:bg-primary/10"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              disabled={isUpdating}
              className="border-primary focus-visible:ring-primary"
            />
          </div>

          {/* Username Color Display */}
          <div className="space-y-2">
            <Label>Username Color</Label>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full border-2 border-border"
                style={{ backgroundColor: userProfile.usernameColor }}
              />
              <span className="text-sm text-muted-foreground">{userProfile.usernameColor}</span>
            </div>
          </div>

          {/* Avatar Preview and Upload */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            
            <div className="flex justify-center mb-4">
              <Avatar className="w-24 h-24 ring-4 ring-primary shadow-lg">
                {uploadedPreview ? (
                  <AvatarImage src={uploadedPreview} alt="Uploaded" />
                ) : currentAvatarUrl ? (
                  <AvatarImage src={currentAvatarUrl} alt={userProfile.username} />
                ) : null}
                <AvatarFallback className="bg-transparent">
                  {renderLetterAvatar(username || userProfile.username, userProfile.usernameColor)}
                </AvatarFallback>
              </Avatar>
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
                disabled={isUpdating}
                className="w-full mb-2 border-primary text-primary hover:bg-primary/10"
              >
                Remove Picture
              </Button>
            )}

            <div>
              <Label
                htmlFor="edit-avatar-upload"
                className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">
                  {uploadedFile ? uploadedFile.name : 'Upload New Picture'}
                </span>
              </Label>
              <Input
                id="edit-avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUpdating}
                className="hidden"
                ref={fileInputRef}
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="space-y-2">
            <Label htmlFor="theme-toggle">Theme</Label>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Dark Mode</span>
                <span className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <Switch
                id="theme-toggle"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isUpdating || !username.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
