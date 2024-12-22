import { StyleSheet, Text, Pressable } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'
import { router } from 'expo-router'

const BackButton = ({size = 26}) => {
  return (
    <Pressable onPress={() => router.back()} style={styles.button}>
      <Icon name="arrowLeft" strokeWidth={2.5} size={size} color={theme.colors.text}/>
    </Pressable>
  )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
      alignSelf: 'flex-start',
      padding: 3,
      borderRadius: theme.radius.sm,
      backgroundColor: 'rgba(0,0,0,0.07)',
      marginLeft: 20,
  
    }
})