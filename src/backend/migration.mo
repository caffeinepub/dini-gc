import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";

module {
  type MessageId = Nat;
  type PictureId = Text;
  type EmojiId = Text;
  type MediaType = {
    #image;
    #video;
    #gif;
  };

  type MediaFile = {
    id : Nat;
    mediaType : MediaType;
    blob : Storage.ExternalBlob;
    fileName : Text;
  };

  type Theme = { #light; #dark };
  type Message = {
    id : MessageId;
    content : Text;
    userId : Text;
    timestamp : Int;
    mediaFiles : [MediaFile];
    customEmojis : [EmojiId];
  };

  type Emoji = {
    id : EmojiId;
    name : Text;
    blob : Storage.ExternalBlob;
  };

  type OldUserProfile = {
    username : Text;
    profilePictureId : PictureId;
    usernameColor : Text;
  };

  type OldActor = {
    messages : Map.Map<MessageId, Message>;
    userProfiles : Map.Map<Text, OldUserProfile>;
    defaultPictures : Map.Map<PictureId, Storage.ExternalBlob>;
    emojis : Map.Map<EmojiId, Emoji>;
  };

  type NewUserProfile = {
    username : Text;
    profilePictureId : PictureId;
    usernameColor : Text;
    theme : Theme;
  };

  type NewActor = {
    messages : Map.Map<MessageId, Message>;
    userProfiles : Map.Map<Text, NewUserProfile>;
    defaultPictures : Map.Map<PictureId, Storage.ExternalBlob>;
    emojis : Map.Map<EmojiId, Emoji>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      userProfiles = old.userProfiles.map<Text, OldUserProfile, NewUserProfile>(
        func(_key, profile) {
          {
            profile with
            theme = #light;
          };
        }
      )
    };
  };
};
