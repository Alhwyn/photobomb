import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyUserFromStorage } from '../service/userService';

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verify user from local storage
        const response = await verifyUserFromStorage();

        if (response.success) {
          console.log('User verified successfully:', response.payload);
          router.replace('Main'); // Navigate to lobby.jsx if verification is successful
        } else {
          console.log('User verification failed:', response.msg);
          router.replace('CreateUser'); // Navigate to CreateUser.jsx if verification fails
        }
      } catch (error) {
        console.log('Error during initialization:', error.message);
        router.replace('CreateUser'); // Navigate to CreateUser.jsx on unexpected errors
      }
    };

    initializeApp();
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
};

export default Index;