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
import { supabase } from '../lib/supabase';



const Lobby = () => {
    const router = useRouter();
    const [gamePin, setGamePin] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameId, setGameId] = useState(null);

    // Fetch player in hte game of the game_id
    const fetchPlayers = async () => {
        try {
            console.log('starting fetchplay');


            const { data, error } = await supabase
                .from('playerGame')
                .select(`player_id, 
                         game_id,
                         is_creator,
                         users (username, image_url),
                         games (game_pin)
                `)



            if (error) {
                console.log('Error fetching the players: ', error.message);
                return;
            }
            console.log(data);
            setGamePin(data?.[0]?.games?.game_pin);
            setGameId(data?.[0]?.game_id);

            setPlayers(data);

        } catch(error) {
            console.log('Error fetching the players: ', error.message);
            return;
        }
    };

    useEffect(() => {
        fetchPlayers();

        // subscribe to the realtime updates
        const channel = supabase
        .channel('playerGame-channel') // Name your channel
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'playerGame', filter: `game_id=eq.${gameId}` },
            (payload) => {
            console.log('Real-time update received:', payload.new);
            fetchPlayers(); // Refetch players when a new user joins
            }
        )
        .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    
    }, [gameId]); 

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
            lobbyData={players}
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
