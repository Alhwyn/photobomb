import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';




export const getSupabaseFileUrl = (filePath) => {
    if (filePath) {
        const { data, error } = supabase
            .storage
            .from('user-profiles')
            .getPublicUrl(filePath);

        if (error) {
            console.error('Error fetching public URL:', error.message);
            return null;
        }

        console.log('data form the getSupabaseUrl: ', data);

        return { uri: data.publicUrl };
    }
    return null;
};

export const getSupabaseUrl = (filePath) => {

    if (filePath) {
        const fullUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`;
        return fullUrl;
    } else {
        return null
    }

    


}