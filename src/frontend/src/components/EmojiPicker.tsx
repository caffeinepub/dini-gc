import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { X, Upload, Loader2, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAllEmojis, useUploadEmoji } from '../hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmojiPickerProps {
  onSelect: (emojiId: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [emojiName, setEmojiName] = useState('');
  const [emojiFile, setEmojiFile] = useState<File | null>(null);
  const [emojiPreview, setEmojiPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: emojis = [], isLoading, isError, refetch } = useAllEmojis();
  const uploadEmojiMutation = useUploadEmoji();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be smaller than 2MB');
        return;
      }
      setEmojiFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmojiPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadEmoji = async () => {
    if (!emojiName.trim()) {
      toast.error('Please enter an emoji name');
      return;
    }
    if (!emojiFile) {
      toast.error('Please select an emoji image');
      return;
    }

    setIsUploading(true);

    try {
      const arrayBuffer = await emojiFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      await uploadEmojiMutation.mutateAsync({
        bytes,
        name: emojiName.trim(),
      });

      toast.success('Emoji uploaded successfully!');
      setEmojiName('');
      setEmojiFile(null);
      setEmojiPreview('');
      setShowUpload(false);
      refetch();
    } catch (error) {
      console.error('Error uploading emoji:', error);
      toast.error('Failed to upload emoji. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-card border-t border-primary">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary">Custom Emojis</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
              className="border-primary text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Upload Emoji
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>

        {/* Upload Form */}
        {showUpload && (
          <div className="mb-4 p-4 border border-primary rounded-lg bg-accent/50 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="emoji-name" className="text-primary">Emoji Name</Label>
              <Input
                id="emoji-name"
                placeholder="e.g., happy, cool, party"
                value={emojiName}
                onChange={(e) => setEmojiName(e.target.value)}
                disabled={isUploading}
                maxLength={30}
                className="border-primary focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emoji-file" className="text-primary">Emoji Image</Label>
              <Label
                htmlFor="emoji-file"
                className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary rounded-lg cursor-pointer hover:border-primary hover:bg-accent transition-colors ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">
                  {emojiFile ? emojiFile.name : 'Select Image (max 2MB)'}
                </span>
              </Label>
              <Input
                id="emoji-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              {emojiPreview && (
                <div className="flex justify-center">
                  <img
                    src={emojiPreview}
                    alt="Preview"
                    className="w-16 h-16 object-contain border border-primary rounded"
                  />
                </div>
              )}
            </div>
            <Button
              onClick={handleUploadEmoji}
              disabled={isUploading || !emojiName.trim() || !emojiFile}
              className="w-full bg-primary text-white hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Emoji'
              )}
            </Button>
          </div>
        )}

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load emojis. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Emoji Grid */}
        <ScrollArea className="h-60">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-primary">Loading emojis...</p>
              </div>
            </div>
          ) : emojis.length === 0 ? (
            <div className="flex items-center justify-center h-full text-primary">
              <div className="text-center">
                <p className="text-sm mb-2">No custom emojis yet</p>
                <p className="text-xs">Upload your first emoji to get started!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pb-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji.id}
                  onClick={() => {
                    onSelect(emoji.id);
                    toast.success(`Added :${emoji.name}:`);
                  }}
                  className="relative aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-primary transition-all group bg-accent/50 p-2"
                  title={emoji.name}
                >
                  <img
                    src={emoji.blob.getDirectURL()}
                    alt={emoji.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {emoji.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
