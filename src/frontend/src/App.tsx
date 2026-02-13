import { useState, useEffect } from 'react';
import JoinScreen from './components/JoinScreen';
import ChatScreen from './components/ChatScreen';
import { Toaster } from '@/components/ui/sonner';

export interface UserProfile {
  userId: string;
  username: string;
  pictureId: string;
  usernameColor: string;
}

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Check if user has already joined (stored in sessionStorage)
  useEffect(() => {
    const storedProfile = sessionStorage.getItem('chatUserProfile');
    if (storedProfile) {
      try {
        setUserProfile(JSON.parse(storedProfile));
      } catch (e) {
        sessionStorage.removeItem('chatUserProfile');
      }
    }
  }, []);

  const handleJoin = (userId: string, username: string, pictureId: string, usernameColor: string) => {
    const profile: UserProfile = {
      userId,
      username,
      pictureId,
      usernameColor,
    };
    setUserProfile(profile);
    sessionStorage.setItem('chatUserProfile', JSON.stringify(profile));
  };

  const handleLeave = () => {
    setUserProfile(null);
    sessionStorage.removeItem('chatUserProfile');
  };

  return (
    <div className="min-h-screen bg-background">
      {!userProfile ? (
        <JoinScreen onJoin={handleJoin} />
      ) : (
        <ChatScreen 
          userProfile={userProfile} 
          onLeave={handleLeave}
        />
      )}
      <Toaster />
    </div>
  );
}

export default App;
