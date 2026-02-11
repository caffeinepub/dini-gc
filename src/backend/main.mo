import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type UserId = Text;
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

  type UserProfile = {
    username : Text;
    profilePictureId : PictureId;
    usernameColor : Text;
  };

  type Emoji = {
    id : EmojiId;
    name : Text;
    blob : Storage.ExternalBlob;
  };

  type Message = {
    id : MessageId;
    content : Text;
    userId : UserId;
    timestamp : Time.Time;
    mediaFiles : [MediaFile];
    customEmojis : [EmojiId];
  };

  module Message {
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Nat.compare(message1.id, message2.id);
    };

    public func compareByTimestamp(message1 : Message, message2 : Message) : Order.Order {
      Int.compare(message1.timestamp, message2.timestamp);
    };
  };

  let messages = Map.empty<MessageId, Message>();
  let userProfiles = Map.empty<UserId, UserProfile>();
  let userPrincipals = Map.empty<Text, Text>();
  let mediaFiles = Map.empty<Nat, MediaFile>();
  let defaultPictures = Map.empty<PictureId, Storage.ExternalBlob>();
  let emojis = Map.empty<EmojiId, Emoji>();

  var nextMessageId = 0;
  var nextMediaId = 0;
  var nextEmojiId = 0;
  var anonymousCount = 0;

  // Create User - Allow duplicate usernames for returning users
  public shared ({ caller }) func join(username : Text, profilePictureId : PictureId, usernameColor : Text) : async UserId {
    // No authorization check - anonymous users (guests) can join the chat
    let userId = if (username == "") { "Anonymous" } else { username };

    // Sanitize anonymous usernames by appending count to avoid duplicates
    func sanitizeAnonName(name : Text) : Text {
      switch (userProfiles.get(name)) {
        case (null) { name };
        case (?_) { sanitizeAnonName(name # "1") };
      };
    };

    // Check if username already exists for the caller's principal
    let callerText = caller.toText();

    // Check if username is associated with a different principal
    switch (userPrincipals.get(username)) {
      case (?existingPrincipal) {
        if (existingPrincipal != callerText) {
          Runtime.trap("Sorry, this username already exists. Please choose a different username.");
        } else {
          return username;
        };
      };
      case (null) {
        let newUsername = if (userId == "Anonymous") {
          anonymousCount += 1;
          sanitizeAnonName("Anonymous" # anonymousCount.toText());
        } else {
          userId;
        };
        let newUserProfile : UserProfile = {
          username = newUsername;
          profilePictureId;
          usernameColor;
        };
        userProfiles.add(newUsername, newUserProfile);
        userPrincipals.add(newUsername, callerText);
        newUsername;
      };
    };
  };

  public shared ({ caller }) func updateUserProfile(userId : UserId, username : Text, profilePictureId : PictureId, usernameColor : Text) : async () {
    // Verify ownership: caller must own the profile they're updating
    let callerText = caller.toText();
    switch (userPrincipals.get(username)) {
      case (null) {
        Runtime.trap("Unauthorized: You must join the chat before updating your profile");
      };
      case (?principal) {
        if (principal != callerText) {
          Runtime.trap("Unauthorized: You can only update your own profile");
        };

        switch (userProfiles.get(userId)) {
          case (null) {
            Runtime.trap("User profile not found");
          };
          case (?_) {
            let updatedProfile : UserProfile = {
              username;
              profilePictureId;
              usernameColor;
            };
            userProfiles.add(userId, updatedProfile);
          };
        };
      };
    };
  };

  public shared ({ caller }) func sendMessage(content : Text, userId : UserId, mediaFileIds : [Nat], customEmojis : [EmojiId]) : async MessageId {
    // No authorization check - anonymous users (guests) can send messages
    switch (userProfiles.get(userId)) {
      case (null) {
        Runtime.trap("User not found. Please create a user first.");
      };
      case (?_) {
        if (content.size() == 0 and mediaFileIds.size() == 0 and customEmojis.size() == 0) {
          Runtime.trap("Please include text, a file, or an emoji in your message.");
        };

        let newMessageId = nextMessageId;

        let filteredMediaFiles = mediaFileIds.map(
          func(id) {
            switch (mediaFiles.get(id)) {
              case (null) {
                Runtime.trap("Failed to find a file. Please retry the upload.");
              };
              case (?file) { file };
            };
          }
        );

        let message = {
          id = newMessageId;
          content;
          userId;
          timestamp = Time.now();
          mediaFiles = filteredMediaFiles;
          customEmojis;
        };

        messages.add(newMessageId, message);
        nextMessageId += 1;
        newMessageId;
      };
    };
  };

  public shared ({ caller }) func uploadMedia(blob : Storage.ExternalBlob, mediaType : MediaType, fileName : Text) : async Nat {
    // No authorization check - anonymous users (guests) can upload media
    let mediaId = nextMediaId;
    let mediaFile = {
      id = mediaId;
      mediaType;
      fileName;
      blob;
    };
    mediaFiles.add(mediaId, mediaFile);
    nextMediaId += 1;
    mediaId;
  };

  public shared ({ caller }) func uploadProfilePicture(blob : Storage.ExternalBlob, pictureId : PictureId) : async () {
    // No authorization check - anonymous users (guests) can upload profile pictures
    switch (defaultPictures.get(pictureId)) {
      case (null) {
        defaultPictures.add(pictureId, blob);
      };
      case (?_) {
        Runtime.trap("Picture name already exists. Please choose a different name.");
      };
    };
  };

  public shared ({ caller }) func addDefaultPicture(blob : Storage.ExternalBlob, pictureId : PictureId) : async () {
    // Admin-only function
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add default pictures");
    };

    switch (defaultPictures.get(pictureId)) {
      case (null) {
        defaultPictures.add(pictureId, blob);
      };
      case (?_) {
        Runtime.trap("Picture name already exists. Please choose a different name.");
      };
    };
  };

  public shared ({ caller }) func uploadEmoji(blob : Storage.ExternalBlob, name : Text) : async EmojiId {
    // No authorization check - anonymous users (guests) can upload emojis
    let emojiId = nextEmojiId.toText();
    let emoji : Emoji = {
      id = emojiId;
      name;
      blob;
    };
    emojis.add(emojiId, emoji);
    nextEmojiId += 1;
    emojiId;
  };

  public query ({ caller }) func getMessagesSince(lastMessageId : MessageId) : async [Message] {
    // No authorization check - public read access for all users including guests
    let filteredMessages = messages.values().toArray().filter(
      func(msg) { msg.id > lastMessageId }
    );
    filteredMessages.sort();
  };

  public query ({ caller }) func getRecentMessages(limit : Nat) : async [Message] {
    // No authorization check - public read access for all users including guests
    let allMessages = messages.values().toArray().sort();
    let reversed = allMessages.reverse();
    let actualLimit = if (limit > allMessages.size()) { messages.size() } else { limit };
    let sliced = Array.tabulate(actualLimit, func(i : Nat) : Message { reversed[i] });
    sliced.sort(Message.compareByTimestamp).reverse();
  };

  public query ({ caller }) func getAllMessages() : async [Message] {
    // No authorization check - public read access for all users including guests
    messages.values().toArray().sort();
  };

  public query ({ caller }) func listDefaultPictures() : async [(PictureId, Storage.ExternalBlob)] {
    // No authorization check - public read access for all users including guests
    defaultPictures.entries().toArray();
  };

  public query ({ caller }) func getDefaultPicture(pictureId : PictureId) : async ?Storage.ExternalBlob {
    // No authorization check - public read access for all users including guests
    defaultPictures.get(pictureId);
  };

  public query ({ caller }) func getMediaById(mediaId : Nat) : async ?MediaFile {
    // No authorization check - public read access for all users including guests
    mediaFiles.get(mediaId);
  };

  public query ({ caller }) func getEmojiById(emojiId : EmojiId) : async ?Emoji {
    // No authorization check - public read access for all users including guests
    emojis.get(emojiId);
  };

  public query ({ caller }) func getAllEmojis() : async [Emoji] {
    // No authorization check - public read access for all users including guests
    emojis.values().toArray();
  };

  public query ({ caller }) func getMessageCount() : async Nat {
    // No authorization check - public read access for all users including guests
    messages.size();
  };

  public query ({ caller }) func getMediaCount() : async Nat {
    // No authorization check - public read access for all users including guests
    mediaFiles.size();
  };

  public query ({ caller }) func getEmojiCount() : async Nat {
    // No authorization check - public read access for all users including guests
    emojis.size();
  };

  public query ({ caller }) func getUserProfile(userId : UserId) : async ?UserProfile {
    // No authorization check - public read access for all users including guests
    userProfiles.get(userId);
  };

  public query ({ caller }) func getAllMessagesMedia() : async [(Message, [MediaFile])] {
    // No authorization check - public read access for all users including guests
    let allMessages = messages.values().toArray();
    allMessages.map<Message, (Message, [MediaFile])>(
        func(message) {
          let messageMediaFiles = message.mediaFiles;
          (message, messageMediaFiles);
        }
      ).reverse();
  };

  public query ({ caller }) func getAnonymousCount() : async Nat {
    // No authorization check - public read access for all users including guests
    anonymousCount;
  };

  public shared ({ caller }) func initializeDefaults(defaults : [(PictureId, Storage.ExternalBlob)]) : async () {
    // Admin-only function
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize defaults");
    };

    for (entry in defaults.vals()) {
      switch (entry) {
        case ((id, blob)) { defaultPictures.add(id, blob) };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    // No authorization check - returns profile for current caller if exists
    let callerText = caller.toText();
    switch (userPrincipals.get(callerText)) {
      case (null) { null };
      case (?username) { userProfiles.get(username) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // Not supported in anonymous mode - users should use updateUserProfile instead
    Runtime.trap("Saving caller profile not supported in anonymous mode. Use updateUserProfile instead.");
  };
};
