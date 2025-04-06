import { StyleSheet, Text, View, Image, Animated, Easing } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { getSupabaseUrl } from '../../service/imageService'
import ConfettiCannon from 'react-native-confetti-cannon'
import Profile from '../Profile'

const Winner = ({ winnerData, currentPrompt }) => {
  const scaleAnim = useRef(new Animated.Value(0.2)).current;
  const positionAnim = useRef(new Animated.Value(200)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 300);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(positionAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      })
    ]).start();

    return () => clearTimeout(timer);
  }, []);

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
        <Profile image_url={getSupabaseUrl(winnerData?.image_url)}/>
        <Text style={styles.titleText}>
          {winnerData.username} got the best photo for 
        </Text>
        <LinearGradient
          colors={['#d3d3d3', '#e8e8e8']}
          style={styles.promptCard}
        >
          <View style={styles.promptContent}>
            <Text style={styles.promptText}>{currentPrompt}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.imageContainer}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { 
              transform: [
                { scale: scaleAnim },
                { translateY: positionAnim }
              ] 
            }
          ]}
        >
          <Image
            source={{ uri: getSupabaseUrl(winnerData.photo_uri) }}
            style={styles.winnerImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{x: -10, y: 0}}
          explosionSpeed={350}
          fallSpeed={3000}
          fadeOut={true}
        />
      )}
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
    position: 'relative',
    overflow: 'hidden', 
  },
  header: {
    alignItems: 'column',
    width: '100%',

  },
  imageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 150,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  promptCard: {
    borderRadius: 12,
    padding: 2,
    width: '90%',
  },
  promptContent: {
    borderRadius: 10,
    padding: 10,
  },
  promptText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
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
    height: 300,
    width: 300,
  },
})