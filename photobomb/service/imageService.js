import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';

export const uploadProfileImage = async (imageUri) => {
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

export const getSupabaseImageUrl = (filePath) => {
    if (!filePath) {
        console.error('File path is required to generate the URL.');
        return null;
    }

    const { data, error } = supabase.storage
    .from('user-profiles')
    .getPublicUrl(filePath);

    if (error) {
        console.error('Error generating public URL:', error.message);
        return null;
      }
    
    return data;
}

export const getUserImageSrc = imagePath => {
    if(imagePath){
        return getSupabaseFileUrl(imagePath);
    }else{
        return require('../assets/images/defaultUser.png');
    }
}

export const getSupabaseFileUrl = filePath => {
    if(filePath){
        return{uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`}
    }
    return null;
}