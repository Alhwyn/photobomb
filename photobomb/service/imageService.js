import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';




export const getSupabaseFileUrl = (filePath) => {
    /**
     * retreives a public url for a file stored in the  supabase 'user-profiles' bucket.
     * @param {string} filePath = the path of the file in the supabase storag bucket.
     * @returns {Object|null} - NA object containing the `uri` with the public URL if successful, or `null` if an error
     *
     */
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
    /**
     * constructs a full public URL for a fule stored in the supabase 'uploads' folder.
     * @param {string} filePath - the path of the file within the uploads folder
     * @returns {string|null} - the full public URL of the file of the file is valid, or null 
     */

    if (filePath) {
        const fullUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`;
        return fullUrl;
    } else {
        return null
    }

    


}