import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import React, { useEffect, useState } from 'react'
import BackButton from '../components/BackButton'
import { theme } from '../constants/theme'
import Profile from '../components/Profile'
import Input from '../components/Input'
import { getUserPayloadFromStorage } from '../service/userService'

const userProfile = () => {

    const [userPayload, setUserPayload] = useState(null); 



    // fetching the user data form the local storage

    useEffect(() => {
        const fetchUserData = async () => {
            const data = await getUserPayloadFromStorage();
            if (data) {
                setUserPayload(data);
            }
        };
        fetchUserData();
    }, []);

    if (!userPayload) {
        return (
          <View style={styles.container}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        );
    }


  return (
    <SafeAreaView style={styles.container}>
        <BackButton/>
        <View style={styles.headerContainer}>
            <Text style={styles.title}>
                User Profile
            </Text>

            <Profile
                profileSize={64}
            />
            <Text style={styles.text}>
                Username: {userPayload.username}
            </Text>
            <Text style={styles.text}>
                Status: {userPayload.status}
            </Text>
            <Text style={styles.text}>
                Image URL: {userPayload.image_url || 'No image available'}
            </Text>
            <Text style={styles.text}>
                ID: {userPayload.id}
            </Text>
            
        </View>
      
    </SafeAreaView>
  )
}

export default userProfile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Sleek dark background
    },
    title: {
        color: '#ffffff', 
        fontWeight: theme.fonts.extraBold,
        fontSize: 32,
      },
    headerContainer: {
        alignItems: 'center',
        paddingTop: 10,
    },
    text: {
        color: '#ffffff'
    }
})