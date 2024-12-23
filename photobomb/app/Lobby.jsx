import { StyleSheet, Text, View, SafeAreaView, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react';
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button' 
import { getGameId } from '../service/gameService';
import { getUserPayloadFromStorage } from '../service/userService';


const Lobby = () => {

    const [gamePin, setGamePin] = useState(null);
    const [UserCreator, setUserCreator] = useState(null);



    useEffect(() => {
        const retrieveGameData = async () => {
            try {
                const userData = await getUserPayloadFromStorage();
                const gameData = await getGameId(userData?.id);
        
                if (gameData.success) {
                    setGamePin(gameData?.data?.[0]?.game_pin);
                    setUserCreator([{
                        is_creator: true,
                        payload: {
                            username: userData?.username,
                            image_url: null,
                        }
                    }]);

                }


                console.log('retrieveGameData: ', gameData);
            } catch (error) {
                console.error('Error in retrieveGameData:', error);
            }
        };
        
        retrieveGameData();
    }, []); 


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
                <Text style={styles.text}>{gamePin}</Text>
            </LinearGradient>
        </View>
        
        <UserLobby
            users={UserCreator}
        />

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
