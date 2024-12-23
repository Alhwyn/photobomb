import { supabase } from '../lib/supabase';

export const checkGamePin = async (pin) => {

    try {

        const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_pin', pin);

        if (error) {
            console.log('Error checking game PIN', error.message);
            return { success: false, msg: error.message };
        }

        return {success: true, data}
    } catch(error) {
        console.log('Error checking Pin', error.message);
        return { success: false, msg: error.message };
    }

}