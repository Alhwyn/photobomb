import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import Button from '../components/Button'
import { LinearGradient } from 'expo-linear-gradient';
import { getSupabaseUrl, } from '../service/imageService';
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Profile from '../components/Profile';
import { theme } from '../constants/theme';
import { getUserPayloadFromStorage } from '../service/userService'
// Setting

const Main = () => {
    const router = useRouter();
    const [userPayload, setUserPayload] = useState(null); 
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        console.log('Updated userPayload: ', userPayload);

        const fetchUserData = async () => {
            const data = await getUserPayloadFromStorage();

            if (data) {
                setUserPayload(data);

                const imageSource = await getSupabaseUrl(data?.image_url);

                console.log('this is the big image:  ', imageSource);

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
        <StatusBar barStyle="light-content" />
        {/* Header with Profile */}
        <View style={styles.header}> 
            {/* Profile Pic Compnonent */}
            <TouchableOpacity onPress={() => router.push('userProfile')}>
                <Profile 
                    profileSize={48}
                    image_url={profileImage}
                />
            </TouchableOpacity>
            <Text style={styles.usernameText}>{userPayload?.username}</Text>
        </View>
        <View style={styles.textCenter}>
            <Text style={styles.bombText}>Photo</Text>
            <LinearGradient 
                colors={['#8A2BE2', '#DA70D6', '#BA55D3']}
                style={styles.bombTextGradient}
            >
                <Text style={styles.bombText}>Bomb</Text>
            </LinearGradient>
        </View>
        <View style={styles.touchContainer}>
            <Button
                title="Create Game"
                colors={theme.buttonGradient.primary} // Blue to Indigo
                onPress={()=> router.push('gameSelector')}
            />
            <Button 
                title='Join Game' 
                colors={theme.buttonGradient.secondary} 
                onPress={()=> router.push('joinGame')}
            />
        </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121212',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        marginTop: '10',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 32,
      marginLeft: 20,
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
    },
    touchContainer: {
        gap: 20,
        marginBottom: 150, 
        justifyContent: 'flex-end', 
        flex: 1,
        paddingLeft: 20,
        paddingRight: 20,
    },
    textCenter: {
        flex: 1,
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
    },
    bombTextGradient: {
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    bombText: {
        color: 'white',
        fontSize: 36, // Make it large
        fontWeight: '600', // Semi-bold for "pop"
        textAlign: 'center',
    },
    usernameText: {
        color: 'white',
        fontWeight: theme.fonts.extraBold,
        fontSize: 16,


    }
  });
  
  
export default Main