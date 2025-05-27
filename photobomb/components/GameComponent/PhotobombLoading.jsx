import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import LottieView from 'lottie-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
} from 'react-native-reanimated'
const LoadingPhotobomb = ({
  message = "Prompter is picking a prompt...",
  color = 'white',
  showMessage = true
}) => {
  // Animation values
  const animationScale = useSharedValue(0.7);
  const animationOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(20);

  // Animated styles
  const animationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animationScale.value }],
    opacity: animationOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  // Start animations on mount
  useEffect(() => {
    // Animation entrance
    animationScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    animationOpacity.value = withTiming(1, { duration: 600 });
    
    // Text entrance with slight delay
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 400 });
      textY.value = withSpring(0, { damping: 8, stiffness: 120 });
    }, 300);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animationContainer, animationAnimatedStyle]}>
        <LottieView
            source={require('../../assets/json/Sleepy.json')}
            autoPlay
            loop={true}
            style={styles.lottieAnimation}
        />
      </Animated.View>
      
      {showMessage && (
        <Animated.Text style={[styles.loadingText, {color}, textAnimatedStyle]}>
          {message}
        </Animated.Text>
      )}
    </View>
  )
}



export default LoadingPhotobomb

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  animationContainer: {
    width: 220,
    height: 220,
    borderRadius: 80,
    overflow: 'hidden', // This hides any watermarks or content outside the container
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  lottieAnimation: {
    width: 280,
    height: 280,
    position: 'absolute',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
  }
})