import { Text, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Loading from '../components/Loading'
import Button from '../components/Button'

const index = () => {
  const router = useRouter();

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <Button title="press me" onPress={()=> router.push('lobby')}/>
     {/*  <Loading /> */}
    </View>
  )
}

 
export default index