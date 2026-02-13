import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import type { Message, UserId, PictureId, UserProfile } from '../backend';

export function useMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000,
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

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
      if (!actor) throw new Error('Actor not available');
      
      try {
        const userId = await actor.join(username, profilePictureId, usernameColor);
        return userId;
      } catch (error: any) {
        if (error?.message?.includes('username already exists')) {
          throw new Error('USERNAME_TAKEN');
        }
        if (error?.message?.includes('Unauthorized')) {
          throw new Error('UNAUTHORIZED');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

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
      if (!actor) throw new Error('Actor not available');
      await actor.updateUserProfile(userId, username, profilePictureId, usernameColor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      userId,
      mediaFileIds,
      customEmojis,
    }: {
      content: string;
      userId: UserId;
      mediaFileIds: bigint[];
      customEmojis: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(content, userId, mediaFileIds, customEmojis);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useUploadProfilePicture() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ bytes, pictureId }: { bytes: Uint8Array; pictureId: PictureId }) => {
      if (!actor) throw new Error('Actor not available');
      const blob = ExternalBlob.fromBytes(new Uint8Array(bytes.buffer) as Uint8Array<ArrayBuffer>);
      await actor.uploadProfilePicture(blob, pictureId);
    },
  });
}

export function usePictureUrl(pictureId: PictureId) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['picture', pictureId],
    queryFn: async () => {
      if (!actor || !pictureId) return null;
      const picture = await actor.getDefaultPicture(pictureId);
      if (!picture) return null;
      return picture.getDirectURL();
    },
    enabled: !!actor && !isFetching && !!pictureId,
  });
}

export function useUserProfile(userId: UserId) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getUserProfile(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}
