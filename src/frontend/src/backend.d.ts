import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Emoji {
    id: EmojiId;
    blob: ExternalBlob;
    name: string;
}
export interface MediaFile {
    id: bigint;
    blob: ExternalBlob;
    fileName: string;
    mediaType: MediaType;
}
export type Time = bigint;
export type EmojiId = string;
export type PictureId = string;
export type UserId = string;
export type MessageId = bigint;
export interface Message {
    id: MessageId;
    content: string;
    userId: UserId;
    customEmojis: Array<EmojiId>;
    timestamp: Time;
    mediaFiles: Array<MediaFile>;
}
export interface UserProfile {
    username: string;
    usernameColor: string;
    profilePictureId: PictureId;
}
export enum MediaType {
    gif = "gif",
    video = "video",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDefaultPicture(blob: ExternalBlob, pictureId: PictureId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllEmojis(): Promise<Array<Emoji>>;
    getAllMessages(): Promise<Array<Message>>;
    getAllMessagesMedia(): Promise<Array<[Message, Array<MediaFile>]>>;
    getAnonymousCount(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDefaultPicture(pictureId: PictureId): Promise<ExternalBlob | null>;
    getEmojiById(emojiId: EmojiId): Promise<Emoji | null>;
    getEmojiCount(): Promise<bigint>;
    getMediaById(mediaId: bigint): Promise<MediaFile | null>;
    getMediaCount(): Promise<bigint>;
    getMessageCount(): Promise<bigint>;
    getMessagesSince(lastMessageId: MessageId): Promise<Array<Message>>;
    getRecentMessages(limit: bigint): Promise<Array<Message>>;
    getUserProfile(userId: UserId): Promise<UserProfile | null>;
    initializeDefaults(defaults: Array<[PictureId, ExternalBlob]>): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    join(username: string, profilePictureId: PictureId, usernameColor: string): Promise<UserId>;
    listDefaultPictures(): Promise<Array<[PictureId, ExternalBlob]>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(content: string, userId: UserId, mediaFileIds: Array<bigint>, customEmojis: Array<EmojiId>): Promise<MessageId>;
    updateUserProfile(userId: UserId, username: string, profilePictureId: PictureId, usernameColor: string): Promise<void>;
    uploadEmoji(blob: ExternalBlob, name: string): Promise<EmojiId>;
    uploadMedia(blob: ExternalBlob, mediaType: MediaType, fileName: string): Promise<bigint>;
    uploadProfilePicture(blob: ExternalBlob, pictureId: PictureId): Promise<void>;
}
