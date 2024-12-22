import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button'


const users = [
    { is_creator: true, payload: { username: 'test', image_url: require('../assets/images/mode1.png') } },

  ];

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
