import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Button from '../components/Button'
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
  withTiming,
  runOnJS,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import LottieView from 'lottie-react-native';
import JoinGameComponent from '../components/JoinGameComponent';
import GameSelectorComponent from '../components/GameSelectorComponent';
const Main = () => {
    const router = useRouter();
    const [userPayload, setUserPayload] = useState(null); 
    const [profileImage, setProfileImage] = useState(null);
    const [IsMainPage, setIsMainPage] = useState('Start'); // Start, Join, Create, Joining
    const [currentComponent, setCurrentComponent] = useState('Buttons'); // Buttons, JoinGame, GameSelector, Lobby
    const animationRef = React.useRef(null);

    // Animation values
    const logoY = useSharedValue(-80);
    const logoScale = useSharedValue(0.7);
    const logoOpacity = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const titleScale = useSharedValue(0.7);
    const buttonsY = useSharedValue(60);
    const buttonsOpacity = useSharedValue(0);
    const buttonsScale = useSharedValue(0.7);
    
    const pulse = useSharedValue(1);
    const shake = useSharedValue(0);

    // Helper for smooth transition between components
    const handleComponentTransition = (mainPage, component) => {
      // Fade out buttons, then switch component, then fade in
      buttonsOpacity.value = withTiming(0, { duration: 100 }, () => {
        runOnJS(setIsMainPage)(mainPage);
        runOnJS(setCurrentComponent)(component);
        buttonsOpacity.value = withTiming(1, { duration: 100 });
      });
    };

    const handleMainAnimationComponent = () => {
      if (IsMainPage === 'Start') { 
        return (
          <LottieView
              source={require('../assets/json/Wake_up.json')}
              autoPlay
              loop={false}
              style={styles.lottieAnimation}
          />
        );
      } else if (IsMainPage === 'Join' || IsMainPage === 'Create') {
        return (
          <LottieView
              ref={animationRef}
              source={require('../assets/json/Excited.json')}
              autoPlay
              loop={false}
              style={styles.lottieAnimation}
              onAnimationFinish={() => {
                runOnJS(setIsMainPage)(IsMainPage === 'Join' ? 'Joining' : 'Creating');
              }}
          />
        );
      } else if (
        IsMainPage === 'Joining' ||
        IsMainPage === 'Creating' ||
        currentComponent === 'JoinGame' ||
        currentComponent === 'GameSelector' ||
        currentComponent === 'Lobby'
      ) {
        return (
          <LottieView
              source={require('../assets/json/Exciited_State.json')}
              autoPlay
              loop={true}
              style={styles.lottieAnimation}
          />
        );
      }
    };

    // Animated styles
    const logoAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: shake.value },
        { translateY: logoY.value },
        { scale: logoScale.value },
        { scale: pulse.value },
        { rotate: `${logoY.value * 0.5}deg` }, // playful tilt
      ],
      opacity: logoOpacity.value,
    }));
    const titleAnimatedStyle = useAnimatedStyle(() => ({
      opacity: titleOpacity.value,
      transform: [{ scale: titleScale.value }],
    }));
    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: buttonsY.value },
        { scale: buttonsScale.value },
      ],
      opacity: buttonsOpacity.value,
    }));

    useEffect(() => {
        // Animate logo
        logoY.value = withSpring(0, { damping: 7, stiffness: 120 });
        logoScale.value = withSpring(1, { damping: 7, stiffness: 120 });
        logoOpacity.value = withTiming(1, { duration: 600 });

        shake.value = withTiming(0);
        setIsMainPage('Start');
        setCurrentComponent('Buttons');

        // Title: pop in after logo
        setTimeout(() => {
          titleOpacity.value = withTiming(1, { duration: 400 });
          titleScale.value = withSpring(1, { damping: 7, stiffness: 120 });
        }, 350);

        // Buttons: bounce up and fade in after title
        setTimeout(() => {
          buttonsY.value = withSpring(0, { damping: 8, stiffness: 120 });
          buttonsOpacity.value = withTiming(1, { duration: 400 });
          buttonsScale.value = withSpring(1, { damping: 8, stiffness: 120 });
        }, 700);


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
        <SafeAreaView style={styles.safeArea}>
            {/* Header with Profile */}
            <View style={styles.header}> 
                {/* Profile Pic Component */}
                <TouchableOpacity style={styles.profileButton} onPress={() => router.push('UpdateUser')}>
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
                        {handleMainAnimationComponent()}
                    </View>
                </Animated.View>

                {/* Animated Title */}
                <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
                    <Text style={[styles.titleText, { color: 'white' }]}>PhotoBomb</Text>
                </Animated.View>
                 {/* Animated Button Container */}
                <Animated.View style={[styles.buttonContainer, buttonsAnimatedStyle]}>
                  {currentComponent === 'Buttons' ? (
                    <>
                      <Button
                          title="Create Game"
                          colors={theme.buttonGradient.primary} 
                          textColor="#fff"
                          onPress={() => {
                            shake.value = withRepeat(
                              withSequence(
                                withTiming(-5, { duration: 150 }),
                                withTiming(5,  { duration: 150 })
                              ),
                              -1,
                              true
                            );
                            handleComponentTransition('Create', 'GameSelector');
                          }}
                          style={styles.createButton}
                      />
                      
                      <Button 
                          title="Join Game" 
                          colors={theme.buttonGradient.secondary}
                          textColor="#fff"
                          onPress={() => {
                            shake.value = withRepeat(
                              withSequence(
                                withTiming(-5, { duration: 150 }),
                                withTiming(5,  { duration: 150 })
                              ),
                              -1,
                              true
                            );
                            handleComponentTransition('Join', 'JoinGame');
                          }}
                          style={styles.joinButton}
                      />
                    </>
                  ) : currentComponent === 'JoinGame' ? (
                    <JoinGameComponent 
                      onBack={() => {
                        shake.value = withTiming(0);
                        handleComponentTransition('Start', 'Buttons');
                      }}
                      onSuccessfulJoin={() => {
                        handleComponentTransition('Start', 'Lobby')
                   
                        router.push('Lobby');
                      }}
                    />
                  ) : currentComponent === 'GameSelector' ? (
                    <GameSelectorComponent 
                      onBack={() => {
                        // stop shaking when going back
                        shake.value = withTiming(0);
         
                        handleComponentTransition('Start', 'Buttons');
                      }}
                      onSuccessfulCreate={() => {
                        handleComponentTransition('Start', 'Buttons');
  
                        router.push('Lobby');
                      }}
                    />
                  ) : null}
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
      marginTop: 100,
    },
    lottieClipContainer: {
        width: 200, 
        height: 160,
        overflow: 'hidden',
        borderRadius: 12, // Slightly larger radius for the larger container
        shadowColor: '#ffffff',
        shadowRadius: 10,
        elevation: 10,
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
      flex: 1,  // Added flex to make it expandable for components
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
        width: 250, 
        height: 250,
        top: -10,    
        left: -25,   
        position: 'absolute',
    },
  });
  
  
export default Main