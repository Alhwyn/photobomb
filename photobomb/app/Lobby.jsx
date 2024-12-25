import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react';
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button' 
import { getGameId, deleteGame, deletePlayerGame } from '../service/gameService';
import { getUserData } from '../service/userService';
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

    
    useEffect(() => {
        const fetchPlayers = async () => {
            try {
    
                console.log('Starting fetchPlayers..');
                const getUserPayload = await getUserPayloadFromStorage();

                console.log('this is the userPayload:  ', getUserPayload);

                const userId = getUserPayload?.id;

                console.log("this is the user_id", userId);
    
    
            
                const { data, error } = await supabase
                    .from('users')
                    .select(`*,
                             games (game_pin, id),
                             playerGame (is_creator)
                    `)
                    .eq('id', userId)
                    .single();
    
                if (error) {
                    console.log('Error fetching  the players: ', error.message);
                    return;
                }
    
                if (!data || data.length === 0) {
                    console.error('No players found for the given gameId:', gameId);
                    setPlayers([]); // Clear players if no rows are found
                    return;
                }
                console.log('Fetched data: ', data);
    
                setGamePin(data?.games?.[0]?.game_pin);
                setGameId(data?.games?.[0]?.id);

                const { data: gamePayload, error: Payloaderror } = await supabase
                    .from('playerGame')
                    .select(`
                        *,
                        users (username, image_url)
                        `)
                    .eq('game_id', gameId)

                console.log('this is the game Payload:  ', gamePayload);
    
                setPlayers(gamePayload);
    
            } catch(error) {
                console.log('Error fetching the players:  ', error.message);
                return;
            }
        };
    
        
        fetchPlayers();

        console.log('this is the game id:  ', gameId);
    

        const channelLobby = supabase
        .channel() 
        .on(
            'postgres_changes',
            { schema: 'public', table: 'playerGame', filter: `game_id=eq.${gameId}` },
            (payload) => {
                console.log('Real-time update received:', payload.new);

                if (payload.eventType === 'INSERT') {
                    console.log('PLayer Joined: ', payload.new)
                    setPlayers((prevPlayers) => [...prevPlayers, payload.new]);
                } else if (payload.eventType === 'DELETE') {
                    console.log('Player exited: ', payload.old);
                    setPlayers((prevPlayers) =>
                        prevPlayers.filter((player) => player.player_id !== payload.old.player_id)
                    );
                } else {
                    console.log('Unhandled event Type:', payload.eventType);

                }
            }
        )
        .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channelLobby);
        };
    
    }, [gameId]); 

    const handleExitLobby = async () => {
        try {
            console.log('Starting handleExitLobby...');

            const getUserPayload = await getUserPayloadFromStorage();
            console.log('this is the userPayload:  ', getUserPayload);
            const userId = getUserPayload?.id;
            console.log("this is the user_id", userId);


            

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
        } catch (error) {
            console.error('Error in handleExitLobby:', error.message);
        }

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
                onPress={()=> router.push('/games/MainGame')}
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

        paddingVertical: 10,  
        alignItems: 'center',  
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
