import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Button from '../components/Button'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { wp } from '../helpers/common'
import { useRouter } from 'expo-router'


const lobby = () => {
    const router = useRouter();

  return (
    <ScreenWrapper>
        <StatusBar style='dark' />
        <View style={styles.container}>
            <Button
                title='Hello world'
            />

        </View>



    </ScreenWrapper>
  )
}

export default lobby

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'red',
        marginHorizontal: wp(10)
    }
})