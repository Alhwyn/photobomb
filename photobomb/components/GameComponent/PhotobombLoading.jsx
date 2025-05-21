import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import LottieView from 'lottie-react-native';

const Loading = ({size="large", color=theme.colors.primary}) => {
  return (
    <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <LottieView
            source={require('../assets/json/Wake_up.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
        />
    </View>
  )
}

export default Loading

const styles = StyleSheet.create({})