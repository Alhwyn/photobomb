import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export const handleCreateUser = async ({ username, imageUrl = null, status = 'active' }) => {
  try {
    // Insert the user into the Supabase database
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: username.trim(),
        image_url: imageUrl,
        status: status, // Default status is 'active'
      })
      .select('*') // Return the inserted record
      .single();

    if (error) {
      console.log('Creating User Insert Error:', error.message);
      return { success: false, msg: error.message };
    }

    // Store the user payload in AsyncStorage
    const payload = {
      id: data.id,
      username: data.username,
      image_url: data.image_url,
      status: data.status,
    };
    await AsyncStorage.setItem('userPayload', JSON.stringify(payload));

    console.log('User created successfully and stored in local storage:', payload);
    return { success: true, payload };
  } catch (error) {
    console.log('Got error:', error.message);
    return { success: false, msg: error.message };
  }
};

export const verifyUserFromStorage = async () => {
  try {
    // Retrieve the user payload from AsyncStorage
    const userPayloadString = await AsyncStorage.getItem('userPayload');

    if (!userPayloadString) {
      console.log('No user data found in local storage.');
      return { success: false, msg: 'No user data in storage' };
    }

    const userPayload = JSON.parse(userPayloadString);
    const { id: uuid } = userPayload;

    // Fetch the user from the database
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uuid)
      .single();

    if (error) {
      console.log('Error fetching user from database:', error.message);
      return { success: false, msg: error.message };
    }

    // Check if the database record matches the local storage data
    if (data && data.id === uuid) {
      console.log('User verification successful:', data);
      return { success: true, payload: data };
    } else {
      console.log('User UUID mismatch or user does not exist in database.');
      return { success: false, msg: 'User UUID mismatch or not found' };
    }
  } catch (error) {
    console.log('Error verifying user:', error.message);
    return { success: false, msg: error.message };
  }
};