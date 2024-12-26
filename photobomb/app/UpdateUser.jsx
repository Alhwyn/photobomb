import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, SafeAreaView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Input from '../components/Input';
import Profile from '../components/Profile';
import { theme } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { getUserPayloadFromStorage } from '../service/userService';


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
        setProfileImage(payload.image_url || null); // Pre-fill image if it exists
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
        quality: 1,
      });

      console.log('this is the result: ', result);


      console.log('this is the uri', result?.assets?.[0]?.uri);


      setProfileImage(result?.assets?.[0]?.uri);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to select an image.');
    }
  };

  const uploadImageToSupabase = async (uri) => {
    if (!uri) return null;
  
    try {
      const fileName = uri.split('/').pop(); // Extract filename
      const fileType = fileName.split('.').pop(); // Extract file extension
  
      // Read file info to get MIME type
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
  
      const mimeType = `image/${fileType.toLowerCase()}`; // Assuming it's an image file
  
      console.log('Uploading image:', uri);
  
      // Convert the URI to a blob for uploading
      const fileContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileBlob = new Blob([Buffer.from(fileContent, 'base64')], {
        type: mimeType,
      });
  
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('user-profiles')
        .upload(`public/${fileName}`, fileBlob, {
          contentType: mimeType,
        });
  
      if (error) {
        console.error('Supabase storage upload error:', error.message);
        return null;
      }
  
      // Retrieve public URL
      const { publicURL } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(data.path);
  
      console.log('Image uploaded successfully, public URL:', publicURL);
  
      return publicURL;
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
  
      // Upload image only if it's a new URI
      if (profileImage && !profileImage.startsWith('http')) {
        imageUrl = await uploadImageToSupabase(profileImage);
      }
  
      // Update user in Supabase
      const { data, error } = await supabase
        .from('users')
        .update({ username, image_url: imageUrl })
        .eq('id', userId);
  
      if (error) throw new Error(`Failed to update user in Supabase: ${error.message}`);

      console.log('this is the updates data: ', data);
  
      // Update AsyncStorage with new payload
      const userPayloadString = await AsyncStorage.getItem('userPayload');
      let updatedPayload;
  
      if (userPayloadString) {
        // Merge new data into existing payload
        const existingPayload = JSON.parse(userPayloadString);
        updatedPayload = {
          ...existingPayload,
          username,
          image_url: imageUrl,
        };
      } else {
        // Create a new payload if none exists
        updatedPayload = {
          id: userId,
          username,
          image_url: imageUrl,
          created_at: new Date().toISOString(), // Optional: Add timestamp for newly created payloads
        };
      }
  
      // Save the updated payload back to AsyncStorage
      await AsyncStorage.setItem('userPayload', JSON.stringify(updatedPayload));
  
      console.log('Updated userPayload:', updatedPayload);
  
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
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <Profile profileSize={64} />
              )}
            </TouchableOpacity>
          </View>
          {isUploading && <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 10 }} />}
          <Input
            placeholder="Enter your Username..."
            onChangeText={(text) => setUsername(text)}
            value={username}
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