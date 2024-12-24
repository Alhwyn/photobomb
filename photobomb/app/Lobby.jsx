import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react';
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button' 
import { getGameId, deleteGame, checkUserInLobby, deletePlayerGame } from '../service/gameService';
import { getUserPayloadFromStorage } from '../service/userService';
import ExitButton from '../components/ExitButton';
import { useRouter } from 'expo-router';



const Lobby = () => {
    const router = useRouter();
    const [gamePin, setGamePin] = useState(null);
    const [UserCreator, setUserCreator] = useState(null);
    const [gameId, setGameId] = useState(null);

    useEffect(() => {
        const retrieveGameData = async () => {
            try {
                // 
                const userId = await getUserPayloadFromStorage();
                console.log('asdfaldfjaslf', userId?.id);
                //gameData
                // get the data
                const userData = await checkUserInLobby(userId?.id);
                
                console.log('userData userData', userData);
        
                if (userData.success) {
                    setGamePin(userData?.data?.games?.game_pin);
                    setGameId(userData?.data?.game_id);
                    setUserCreator([{
                        is_creator: userData?.data?.is_creator,
                        payload: {
                            username: userData?.data?.users?.username,
                            image_url: userData?.data?.users?.image_url
                        }
                    }]);

                }
            } catch (error) {
                console.error('Error in retrieveGameData:', error);
            }
        };
        
        retrieveGameData();
    }, []); 

    const handleExitLobby = async () => {
        // get user ID
        console.log('handleExitLobby called with gameId:', gameId); // Debug log



        const gamePayload = await getGameId(userId);

        if (gamePayload.success) {
            const deletePlayerGameInLobby = await deletePlayerGame(userId, gameId);
            const deleteLobbyGame = await deleteGame(gameId);

            if (deletePlayerGameInLobby.success && deleteLobbyGame.success ) console.log('Succesfully removed the game ');
            return;
        } else {

            const deletePlayerGameInLobby = await deletePlayerGame(userId, gameId);

            if (deletePlayerGameInLobby.success) console.log('User successfully left the game');
        }

        router.back()

    }
    
  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
        <ExitButton onExit={handleExitLobby}/>
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
        position: 'absolute',  
        bottom: 20,            
        left: 0,               
        right: 0,              
        paddingTop: 20,
        paddingVertical: 10,   
        alignItems: 'center',  
        backgroundColor: '#121212', 

    }
})
