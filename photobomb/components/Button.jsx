import { Pressable, StyleSheet, Text, View,  } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { wp, hp } from '../helpers/common'
import Loading from './Loading'
import { LinearGradient } from 'expo-linear-gradient'

const Button = ({
    textStyle,
    title='',
    onPress=()=>{},
    colors = ['#8A2BE2', '#DA70D6'],
    loading = false,
    width = '100%'

}) => {


    if (loading) {
        return (
            <View style={[styles.button, { width },  {backgroundColor: 'black', width}]}>
                <Loading />
            </View>
        )
    }

  return (

    <Pressable onPress={onPress} style={styles.pressable}>
      <LinearGradient
        colors={colors}
        style={[styles.gradient, { width }]}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </Pressable>

  )
}

export default Button

const styles = StyleSheet.create({
    pressable: {
        alignItems: 'center', // Ensure the Pressable is centered within its parent
        justifyContent: 'center',
    },
    button:{
        justifyContent: 'center',
        alignItems: 'center',
        borderCurve: 'continuous',
        borderRadius: theme.radius.xl,
    },
    text: {
        fontSize: hp(2.5),
        color: 'white',
        fontWeight: theme.fonts.bold,
    },
    gradient: {
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
})