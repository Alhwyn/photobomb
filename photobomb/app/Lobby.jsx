import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react';
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button' 
import { getGameId, deleteGame, deletePlayerGame } from '../service/gameService';
import { getUserPayloadFromStorage } from '../service/userService';
import ExitButton from '../components/ExitButton';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';



const Lobby = () => {
    const router = useRouter();
    const [gamePin, setGamePin] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameId, setGameId] = useState(null);
    const [localPlayerData, getLocalPLayerData] = useState(null);

    // Fetch  player in hte game of the game_id

    
    useEffect(() => {
        const fetchPlayers = async () => {
            try {
    
                console.log('Starting fetchPlayers..');
                const getUserPayload = await getUserPayloadFromStorage();

                console.log('this is the userPayload:  ', getUserPayload);

                

                const userId = getUserPayload?.id;

                console.log("this is the user_id", userId);
    
    
                // start with here try to fix the realtime issue in the lobby
                const { data, error } = await supabase
                    .from('users')
                    .select(`*,
                             games (game_pin, id),
                             playerGame (is_creator)
                    `)
                    .eq('id', userId)
                    .single();
    
                if (error) {
                    console.log('Error fetching  the players:  ', error.message);
                    return;
                }
    
                if (!data || data.length === 0) {
                    console.error('No players found for the given gameId:', gameId);
                    setPlayers([]); // Clear players if no rows are found
                    return;
                }
                console.log('Fetched data: ', data);

                getLocalPLayerData(data);
    
                setGamePin(data?.games?.[0]?.game_pin);
                setGameId(data?.games?.[0]?.id);
                // else here
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

        console.log('this is the game id: ', gameId);
    

        const channelLobby = supabase
        .channel('lobby_updates') 
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'playerGame', filter: `game_id=eq.${gameId}` },
            async (payload) => {
                console.log('Real-time update received:', payload.new);

                if (payload.eventType === 'INSERT') {
                    console.log('PLayer Joined: ', payload.new);

                    // fetch the username from user table 
                    const { data: userData, error } = await supabase
                        .from('users')
                        .select('username')
                        .eq('id', payload.new.player_id)
                        .single();

                    if (error) {
                        console.error('Error fetching username: ', error.message);
                        return;
                    }

                    const newPLayer = { ...payload.new, users: {username: userData.username}};
                    setPlayers((prevPlayers) => [...prevPlayers, newPLayer]);

                } else if (payload.eventType === 'DELETE') {
                    console.log('Player exited:', payload.old);
                    setPlayers((prevPlayers) =>
                        prevPlayers.filter((player) => player.player_id !== payload.old.player_id)
                    );
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
        /*
        this function gets the user_id from local storage and the game_id

        if the user is the creator it will remove the game then removing the playerGame rows
        with the foriegn key of the games table

        else false it it remove the the player game row
        */

        // the player data
        console.log('this is the player data: ', localPlayerData);

        console.log('this is the player_id: ', localPlayerData?.id);
        console.log('this is the is_Creator', localPlayerData?.playerGame?.[0]?.is_creator);

        if (localPlayerData?.playerGame?.[0]?.is_creator) {
            const checkGameDelete = await deleteGame(gameId);

            if (!checkGameDelete.success) {
                console.log('Error', 'Game Deletion went unsuccesfull Lobby.jsx');
            } else {
                console.log('')
            }


        }  else {
            deletePlayerGame(localPlayerData?.id, gameId);
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
