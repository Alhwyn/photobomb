import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, {useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { checkGamePin } from '../service/gameService'


// Function to generate unique six digit game ID

const generateUniquePin = async () => {
    let unique = false;
    let pin;

    while (!unique) {

        pin = Math.floor(100000 + Math.random() * 900000).toString();

        unique = !(await checkGamePin(pin));
    }
    return pin; // return the unique PIN
}






const Lobby = () => {
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
            <Text style={styles.title}>
                Game Pin
            </Text>
            <LinearGradient
                colors={['#8A2BE2', '#DA70D6']}
                style={styles.gradient}
            >
                <Text style={styles.text}>123456</Text>
            </LinearGradient>
        </View>
        
        <UserLobby users={users}/>

        <View style={styles.bottomContainer}>
            <Button 
                title='Start Game' 
                colors={theme.buttonGradient.success} 
                onPress={()=> console.log('Press Start Game')}
            />
        </View>
        

    </SafeAreaView>
  )
}

export default Lobby

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', 
    },
    title: {
        color: '#ffffff', 
        fontWeight: theme.fonts.extraBold,
        fontSize: 32,
        paddingBottom: 10,
        
    },
    headerContainer: {

        paddingVertical: 10,   // Vertical padding for the container
        alignItems: 'center',  // Center the button horizontally
        backgroundColor: '#121212', 
    },
    gradient: {
        paddingTop: 10,   
        paddingBottom: 10, 
        paddingLeft: 40,  
        paddingRight: 40, 
        borderRadius: 20,
        alignItems: 'center', 
        justifyContent: 'center',
    },
    text: {
        fontSize: hp(2.5),
        color: 'white',
        fontWeight: theme.fonts.bold,
        fontSize: 30,
    },
   bottomContainer: {
        position: 'absolute',  // Makes it fixed
        bottom: 20,            // Adjust distance from the bottom
        left: 0,               // Align to the left edge
        right: 0,              // Align to the right edge
        paddingTop: 20,
        paddingVertical: 10,   // Vertical padding for the container
        alignItems: 'center',  // Center the button horizontally
        backgroundColor: '#121212', 

    }
})
