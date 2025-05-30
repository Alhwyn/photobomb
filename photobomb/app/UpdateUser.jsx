import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, SafeAreaView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Input from '../components/Input';
import Profile from '../components/Profile';
import { theme } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { getUserPayloadFromStorage } from '../service/userService';
import { getSupabaseUrl } from '../service/imageService';


const UpdateUser = () => {
  const [username, setUsername] = useState('');
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState(null);
  

  useEffect(() => {
    const fetchUserPayload = async () => {
      try {
        const payload = await getUserPayloadFromStorage();

        if (!payload || !payload.id) {
          Alert.alert('Error', 'Invalid user data.');
          return;
        }

        setUserId(payload.id);
        setUsername(payload.username || '');

        console.log(userId);
        console.log(username);

        const getImageUrl = getSupabaseUrl(payload?.image_url);

        setProfileImage(getImageUrl);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch user data.');
      }
    };

    fetchUserPayload();
  }, []);

  const handleSelectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType,
        allowsEditing: true,
        quality: 0.7,
      });

      console.log('this is the result: ', result);
      console.log('this is the uri', result?.assets?.[0]?.uri);
      setProfileImage(result?.assets?.[0]?.uri);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to select an image.');
    }
  }
  const uploadImageToSupabase = async (uri) => {
    if (!uri) return null;
  
    try {
      const fileName = uri.split('/').pop(); 
      const fileType = fileName.split('.').pop().toLowerCase(); 
      const mimeType = fileType === 'jpg' ? 'image/jpeg' : `image/${fileType}`;
  
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      const fileBuffer = Uint8Array.from(atob(fileContent), (c) =>
        c.charCodeAt(0)
      );
  
      console.log('Uploading image:', uri);
  
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(`profiles/${fileName}`, fileBuffer, {
          contentType: mimeType,
        });
  
      if (error) {
        console.error('Supabase storage upload error:', error.message);
        return null;
      }
  
      return data?.path;
    } catch (error) {
      console.error('Image upload failed:', error.message);
      return null;
    }
  };

  const onUpdateUserPress = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
  
    if (!userId) {
      Alert.alert('Error', 'User ID not found.');
      return;
    }
  
    try {
      setIsUploading(true);
  
      let imageUrl = profileImage;
  
      if (profileImage && !profileImage.startsWith('http')) {
        imageUrl = await uploadImageToSupabase(profileImage);
  
        if (!imageUrl) {
          throw new Error('Image upload failed. Please try again.');
        }
    
        const userPayloadString = await AsyncStorage.getItem('userPayload');
        let updatedPayload;

        console.log(userPayloadString);

  
        if (userPayloadString) {
          const existingPayload = JSON.parse(userPayloadString);
          updatedPayload = {
            ...existingPayload,
            username: username,
            image_url: imageUrl,
          };
        } else {
          updatedPayload = {
            id: userId,
            username,
            image_url: imageUrl,
          };
        }
  
        await AsyncStorage.setItem('userPayload', JSON.stringify(updatedPayload));
        console.log('Updated AsyncStorage with new image_url:', updatedPayload);
      }
  
      
      const { data, error } = await supabase
        .from('users') // Ensure the correct table name
        .update({ username, image_url: imageUrl })
        .eq('id', userId);
  
      if (error) {
        throw new Error(`Failed to update user in Supabase: ${error.message}`);
      }
  
      console.log('Updated user in Supabase:', data);
  
      Alert.alert('Success', 'User updated successfully!');
      router.push('Main');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update user');
      console.error('Update error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.bigContainer}>
        <BackButton />
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Update User</Text>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={handleSelectImage}>
              <Profile
                image_url={profileImage}
                profileSize={98}
              />
            </TouchableOpacity>
          </View>
          {isUploading && <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 10 }} />}
          <Input
            placeholder={username}
            onChangeText={(text) => setUsername(text)}
          />
          <Button
            title={isUploading ? 'Updating...' : 'Update'}
            colors={theme.buttonGradient.secondary}
            onPress={onUpdateUserPress}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default UpdateUser;

const styles = StyleSheet.create({
  bigContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  title: {
    color: '#ffffff',
    fontWeight: theme.fonts.extraBold,
    fontSize: 32,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 250,
  },
  profileContainer: {
    alignItems: 'center',
  },
});