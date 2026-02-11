import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Message, PictureId, MediaType, UserId, EmojiId, Emoji, UserProfile } from '../backend';
import { ExternalBlob } from '../backend';

// Fetch all messages with automatic refresh every 1.5 seconds
export function useMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not initialized');
      const messages = await actor.getRecentMessages(BigInt(100));
      return messages;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 1500,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Get message count
export function useMessageCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['messageCount'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not initialized');
      return actor.getMessageCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    retry: 2,
  });
}

// Upload media file
export function useUploadMedia() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      bytes,
      mediaType,
      fileName,
    }: {
      bytes: Uint8Array;
      mediaType: MediaType;
      fileName: string;
    }) => {
      if (!actor) throw new Error('Backend not initialized');
      const typedBytes = new Uint8Array(bytes.buffer as ArrayBuffer);
      const blob = ExternalBlob.fromBytes(typedBytes);
      return actor.uploadMedia(blob, mediaType, fileName);
    },
    retry: 2,
  });
}

// Send a message with optional media files and custom emojis
export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      userId,
      mediaFileIds = [],
      customEmojis = [],
    }: {
      content: string;
      userId: UserId;
      mediaFileIds?: bigint[];
      customEmojis?: EmojiId[];
    }) => {
      if (!actor) throw new Error('Backend not initialized');
      return actor.sendMessage(content, userId, mediaFileIds, customEmojis);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['messageCount'] });
    },
    retry: 2,
  });
}

// Fetch default profile pictures with automatic initialization
export function useDefaultPictures() {
  const { actor, isFetching } = useActor();

  return useQuery<[PictureId, ExternalBlob][]>({
    queryKey: ['defaultPictures'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not initialized');
      
      try {
        // First, try to get existing default pictures
        const existing = await actor.listDefaultPictures();
        
        // If we have default pictures, return them
        if (existing.length > 0) {
          return existing;
        }

        // If no default pictures exist, initialize them
        const defaults: [PictureId, ExternalBlob][] = [];
        for (let i = 1; i <= 8; i++) {
          const pictureId = `avatar-${i}`;
          const url = `/assets/generated/avatar-${i}-transparent.dim_64x64.png`;
          const blob = ExternalBlob.fromURL(url);
          defaults.push([pictureId, blob]);
        }

        // Initialize defaults in the backend
        await actor.initializeDefaults(defaults);
        
        // Return the defaults we just initialized
        return defaults;
      } catch (error: any) {
        console.error('Error in useDefaultPictures:', error);
        
        // If initialization fails (e.g., not admin), still return the avatar URLs
        // so users can see them in the UI
        const fallbackDefaults: [PictureId, ExternalBlob][] = [];
        for (let i = 1; i <= 8; i++) {
          const pictureId = `avatar-${i}`;
          const url = `/assets/generated/avatar-${i}-transparent.dim_64x64.png`;
          const blob = ExternalBlob.fromURL(url);
          fallbackDefaults.push([pictureId, blob]);
        }
        return fallbackDefaults;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Upload custom profile picture
export function useUploadProfilePicture() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ bytes, pictureId }: { bytes: Uint8Array; pictureId: PictureId }) => {
      if (!actor) throw new Error('Backend not initialized');
      const typedBytes = new Uint8Array(bytes.buffer as ArrayBuffer);
      const blob = ExternalBlob.fromBytes(typedBytes);
      return actor.uploadProfilePicture(blob, pictureId);
    },
    retry: 2,
  });
}

// Create user (join chat) with enhanced error handling
export function useCreateUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      username,
      profilePictureId,
      usernameColor,
    }: {
      username: string;
      profilePictureId: PictureId;
      usernameColor: string;
    }) => {
      if (!actor) throw new Error('Backend not initialized');
      
      try {
        // Call the backend join method
        const userId = await actor.join(username, profilePictureId, usernameColor);
        return userId;
      } catch (error: any) {
        // Parse backend error messages and throw with appropriate context
        const errorMessage = error?.message || String(error);
        
        // Check for specific error patterns from backend
        if (errorMessage.includes('username already exists')) {
          throw new Error('USERNAME_TAKEN');
        } else if (errorMessage.includes('Username already exists for this principal')) {
          throw new Error('PRINCIPAL_USERNAME_MISMATCH');
        } else if (errorMessage.includes('Unauthorized')) {
          throw new Error('UNAUTHORIZED');
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new Error('NETWORK_ERROR');
        } else {
          // Re-throw with original message for debugging
          throw error;
        }
      }
    },
    retry: false, // Don't retry on user errors like username taken
  });
}

// Update user profile
export function useUpdateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      username,
      profilePictureId,
      usernameColor,
    }: {
      userId: UserId;
      username: string;
      profilePictureId: PictureId;
      usernameColor: string;
    }) => {
      if (!actor) throw new Error('Backend not initialized');
      return actor.updateUserProfile(userId, username, profilePictureId, usernameColor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    retry: 2,
  });
}

// Get user profile
export function useUserProfile(userId: UserId) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not initialized');
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 30000,
    retry: 2,
  });
}

// Get picture URL for display
export function usePictureUrl(pictureId: PictureId) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['pictureUrl', pictureId],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not initialized');
      
      // For default avatars, use direct asset URLs
      if (pictureId.startsWith('avatar-')) {
        return `/assets/generated/${pictureId}-transparent.dim_64x64.png`;
      }

      // For custom uploaded pictures, get from backend
      try {
        const pictures = await actor.listDefaultPictures();
        const picture = pictures.find(([id]) => id === pictureId);
        
        if (picture) {
          return picture[1].getDirectURL();
        }
      } catch (error) {
        console.error('Error fetching picture URL:', error);
      }

      return '';
    },
    enabled: !!actor && !isFetching && !!pictureId,
    staleTime: Infinity,
    retry: 2,
  });
}

// Upload custom emoji
export function useUploadEmoji() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bytes, name }: { bytes: Uint8Array; name: string }) => {
      if (!actor) throw new Error('Backend not initialized');
      const typedBytes = new Uint8Array(bytes.buffer as ArrayBuffer);
      const blob = ExternalBlob.fromBytes(typedBytes);
      return actor.uploadEmoji(blob, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emojis'] });
    },
    retry: 2,
  });
}

// Get all custom emojis
export function useAllEmojis() {
  const { actor, isFetching } = useActor();

  return useQuery<Emoji[]>({
    queryKey: ['emojis'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not initialized');
      return actor.getAllEmojis();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    retry: 2,
  });
}

// Get emoji by ID
export function useEmojiById(emojiId: EmojiId) {
  const { actor, isFetching } = useActor();

  return useQuery<Emoji | null>({
    queryKey: ['emoji', emojiId],
    queryFn: async () => {
      if (!actor) throw new Error('Backend not initialized');
      return actor.getEmojiById(emojiId);
    },
    enabled: !!actor && !isFetching && !!emojiId,
    staleTime: Infinity,
    retry: 2,
  });
}
