import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const GameLoading = () => {
  return (
    <View style={styles.container}>
        <Text>Game Loading...</Text>
    </View>
  )
}

export default GameLoading

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        
    } 
})