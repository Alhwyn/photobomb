import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export const uplaodProfileImage = async (imageUri) => {
    try {

        const fileName = `public/profile_${Date.now()}.jpg`; // ensure it goes to the pulic folder
        const response = await fetch(imageUri)
        const blob = await response.blob()

        const {data, error} = await supabase.storage
            .from('user-profiles')
            .upload(fileName, blob, {
                contentType: 'image/jpeg',
            });
        
        if (error) {
            throw new Error(error.message);
        }

        const { publicUrl } = supabase.storage
            .from('user-profiles')
            .getPublicUrl(data.path);

        return publicUrl; // returns the URL of the uplaoded image
    
    } catch(error) {
        console.error('Error uploading image: ', error.message);
        throw error;
    }
};