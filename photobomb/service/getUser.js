import { supabase } from '../constants/index';
import * as Application from 'expo-application';




export const getDeviceID = async () => {
    const deviceID = await Application.getInstallationIdAsync();
    return deviceID;
};
  

export const fetchUser = async (deviceID) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('device_id', deviceID)
    .single();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};
