import { Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import Button from '../components/Button'
import { getDeviceID, fetchUser } from '../service/getUser'

const index = () => {


  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const deviceID = await getDeviceId();
      const user = await fetchUser(deviceID);
      
      if (user) {
        router.push('Lobby', { imageUrl: user.imageUrl, username: user.username });
      } else {
        router.push('CreateUser');
      }
    };

    checkUser();
  }, []);

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Button title="press me" onPress={()=> router.push('lobby')}/>
     {/*  <Loading /> */}
    </View>
  )
}

 
export default index