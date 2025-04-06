import { StyleSheet, Text, View, Image, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { getSupabaseUrl } from '../../service/imageService'

const Winner = ({ winnerData }) => {
  // Animation value for rotation
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create an infinite spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 10000, // 10 seconds per rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Map the spin value to a rotation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Handle case when no winner data is available yet
  if (!winnerData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading winner information...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>
          {winnerData.username} got the best photo for
        </Text>
        <LinearGradient
          colors={['#d3d3d3', '#e8e8e8']}
          style={styles.promptCard}
        >
          <View style={styles.promptContent}>
            <Text style={styles.promptText}>{winnerData.prompt}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.imageContainer}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ rotate: spin }] }
          ]}
        >
          <Image
            source={{ uri: getSupabaseUrl(winnerData.photo_uri) }}
            style={styles.winnerImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.scoreText}>+1 points!</Text>
      </View>
    </View>
  )
}

export default Winner

const styles = StyleSheet.create({
  animatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#121212',
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    width: '100%',
  },
  imageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  promptCard: {
    borderRadius: 12,
    marginTop: 15,
    padding: 2,
    width: '90%',
  },
  promptContent: {
    borderRadius: 10,
    padding: 15,
  },
  promptText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scoreText: {
    color: '#ffd700', // Gold color for points
    fontSize: 28,
    fontWeight: 'bold',
  },
  titleText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  winnerImage: {
    borderRadius: 25, // Rounded corners for the image
    height: 250,
    width: 250,
  },
})