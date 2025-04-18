import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export const getUserData = async (userId) => {
  /**
   * fetches user data from the supabase database basedon the user_id
   * @param {string} userId - The ID of the user to fetch
   * @returns {Promise<Object>} - An object containing the success status and user data else an error message.
   */
  try {
    const {data, error}  = await supabase
      .from('users')
      .select('*')
      .eq('id', userId);

    if (error) {

      console.log('Could not fetch user data', error.message);
      return {success: false, msg: error.message};
    }

    return {success: true, data: data};
  } catch(error) {
    console.log('Could not fetch user data', error.message);
    return {success: false, msg: error.message};
  }
}

export const handleCreateUser = async (username) => {
  try {
    /**
     * creates a new user on the supabase database with the provided username
     * @param {string} username - the username for the new user 
     * @returns {PRomis<Object>} - An object containing the success status and user data or an error message.
     */

    const { data, error } = await supabase
      .from('users')
      .insert({
        username: username,
        status: 'active',
        image_url: null,
      })
      .select('*')
      .single();

    if (error) {
      console.log('Creating User Insert Error:', error.message);
      return { success: false, msg: error.message };
    }

    const payload = {
      id: data.id,
      username: data?.username,
      image_url: data?.image_url,
      status: data?.status,
    };
    await AsyncStorage.setItem('userPayload', JSON.stringify(payload));

    console.log('User created successfully and stored in local storage: ', payload);
    return { success: true, data: payload };
  } catch (error) {
    console.log('Got error:', error.message);
    return { success: false, msg: error.message };
  }
};

export const getUserPayloadFromStorage = async () => {
  /**
   * retreievs the userpayload form AsnycStorage
   * @returns {Promise<Object|null>} - the user payload as a parsed object, or `null` if no data is found or an error 
   */
  try {
    const userPayloadString = await AsyncStorage.getItem('userPayload');

    if (!userPayloadString) {
      console.log('No user data found in local storage.');
      return null; // Return null if no data is found
    }

    return JSON.parse(userPayloadString); // Parse and return the user payload
  } catch (error) {
    console.log('Error retrieving user payload from storage:', error.message);
    return null;
  }
};



export const verifyUserFromStorage = async () => {
  /**
   * verifies the user paylaod from the local storage with the supabase 
   * @returns {Promise<Object>} - an object containing the success status and payload if verified, or an error message.
   */
  try {
    
    const userPayload = await getUserPayloadFromStorage();

    if (!userPayload) {
      console.log('No user data found in local storage.');
      return { success: false, msg: 'No user data in storage' };
    }

    
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