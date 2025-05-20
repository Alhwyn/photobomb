import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Button from '../components/Button'
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabaseUrl } from '../service/imageService';
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Profile from '../components/Profile';
import { theme } from '../constants/theme';
import { getUserPayloadFromStorage } from '../service/userService'
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay, 
  withTiming,
} from 'react-native-reanimated'
import LottieView from 'lottie-react-native';

const Main = () => {
    const router = useRouter();
    const [userPayload, setUserPayload] = useState(null); 
    const [profileImage, setProfileImage] = useState(null);

    // Animation values
    const logoY = useSharedValue(-40);
    const logoOpacity = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const buttonsY = useSharedValue(30);
    const buttonsOpacity = useSharedValue(0);

    // Define animated styles
    const logoAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: logoY.value }],
            opacity: logoOpacity.value
        };
    });

    const titleAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: titleOpacity.value
        };
    });

    const buttonsAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: buttonsY.value }],
            opacity: buttonsOpacity.value
        };
    });

    useEffect(() => {
        // Animate logo
        logoY.value = withSpring(0, { damping: 10, stiffness: 80 });
        logoOpacity.value = withTiming(1, { duration: 800 });
        
        // Animate title with delay
        titleOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
        
        // Animate buttons with more delay
        buttonsY.value = withDelay(800, withSpring(0, { damping: 12, stiffness: 80 }));
        buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

        // Fetch user data
        const fetchUserData = async () => {
            const data = await getUserPayloadFromStorage();

            if (data) {
                setUserPayload(data);
                const imageSource = await getSupabaseUrl(data?.image_url);
                setProfileImage(imageSource);
            }
        };
    
        fetchUserData();
    
        const intervalId = setInterval(async () => {
            const updatedData = await getUserPayloadFromStorage();
            if (updatedData && JSON.stringify(updatedData) !== JSON.stringify(userPayload)) {
                setUserPayload(updatedData); 
            }
        }, 1000);
    
        return () => clearInterval(intervalId);
    }, []); 

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar style="light-content" />
        <SafeAreaView style={styles.safeArea}>
            {/* Header with Profile */}
            <View style={styles.header}> 
                {/* Profile Pic Component */}
                <TouchableOpacity style={styles.profileButton} onPress={() => router.push('userProfile')}>
                    <Profile 
                        profileSize={48}
                        image_url={profileImage}
                    />
                </TouchableOpacity>
                <Text style={styles.usernameText}>{userPayload?.username}</Text>
            </View>
            
            <View style={styles.mainContent}>
                {/* Animated Logo */}
                <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                    <View style={styles.lottieClipContainer}>
                        <LottieView
                            source={require('../assets/json/Wake_up.json')}
                            autoPlay
                            loop={false}
                            style={styles.lottieAnimation}
                        />
                    </View>
                </Animated.View>

                {/* Animated Title */}
                <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
                    <Text style={[styles.titleText, { color: 'white' }]}>Photo</Text>
                    <Text style={[styles.titleText, { color: 'white' }]}>Bomb</Text>
                </Animated.View>
                
                {/* Animated Button Container */}
                <Animated.View style={[styles.buttonContainer, buttonsAnimatedStyle]}>
                    <Button
                        title="Create Game"
                        colors={theme.buttonGradient.primary} 
                        textColor="#fff"
                        onPress={() => router.push('gameSelector')}
                        style={styles.createButton}
                    />
                    
                    <Button 
                        title="Join Game" 
                        colors={theme.buttonGradient.secondary}
                        textColor="#fff"
                        onPress={() => router.push('joinGame')}
                        style={styles.joinButton}
                    />
                </Animated.View>
            </View>
     </SafeAreaView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121212',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 20,
      marginBottom: 10,
      marginLeft: 20,
    },
    profileButton: {
      marginRight: 8,
    },
    mainContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    lottieClipContainer: {
        width: 200,  // Increased from 120
        height: 160, // Increased from 100
        overflow: 'hidden',
        borderRadius: 12, // Slightly larger radius for the larger container
    },
    logoCircle: {
      width: 100,    
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bombIconContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(76, 29, 149, 0.8)',
      borderRadius: 20,
      padding: 8,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 50,
        marginTop: 20,
    },
    titleText: {
      fontSize: 42,
      fontWeight: '800',
      color: 'white',
      letterSpacing: 0.5,
    },
    bombTextContainer: {
      borderRadius: 10,
      overflow: 'hidden',
      marginLeft: 8, // Add a small space between the words
    },
    bombTextGradient: {
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    buttonContainer: {
      width: '100%',
      gap: 16,
    },
    createButton: {
      marginBottom: 10,
    },
    joinButton: {
    },
    usernameText: {
      color: 'white',
      fontWeight: theme.fonts.extraBold,
      fontSize: 16,
    },
    lottieAnimation: {
        width: 250,  // Increased from 150
        height: 250, // Increased from 150
        top: -10,    // Adjusted to maintain proper positioning
        left: -25,   // Adjusted to keep animation centered
        position: 'absolute',
    },
  });
  
  
export default Main