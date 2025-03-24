import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyUserFromStorage } from '../service/userService';

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await verifyUserFromStorage();

        if (response.success) {
          console.log('User verified successfully:', response.payload);
          router.replace('Main'); 
        } else {
          console.log('User verification failed:', response.msg);
          router.replace('CreateUser');
        }
      } catch (error) {
        console.error('Error during initialization:', error.message);
        router.replace('CreateUser'); 
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