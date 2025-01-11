import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react';
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button' 
import { deleteGame, deletePlayerGame } from '../service/gameService';
import { getUserPayloadFromStorage } from '../service/userService';
import ExitButton from '../components/ExitButton';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { startGame } from '../service/gameStartService';
import Loading from '../components/Loading';



const Lobby = () => {
    const router = useRouter();
    const [gamePin, setGamePin] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameId, setGameId] = useState(null);
    const [localPlayerData, getLocalPLayerData] = useState(null);
    const [UserIsCreator, setUserIsCreator] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handlePLayerLobby = async (payload) => {
        /*
         * Given the parameter paylaod it takes the payload of the realtime
         * supabase action from an INSERT event and updates the player list of the 
         * user lobby.
         */

        console.log('Real-time update received: ', payload);

        if (payload.eventType === 'DELETE') {
            console.log('Player exited:', payload.old);
            setPlayers((prevPlayers) =>
                prevPlayers.filter((player) => player.player_id !== payload.old.player_id)
            );
        }

        if (payload.eventType === 'INSERT') {

            try {

                console.log('Player Joined: ', payload.new);

                // set game id 
                setGameId(payload.new?.game_id)

                // fetch the username from user table 
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('username')
                    .eq('id', payload.new.player_id)
                    .single();

                if (error || !userData) {
                    console.error('Error fetching username:', error.message);
                    return;
                }

                const newPlayer = { ...payload.new, users: {username: userData.username}};
                setPlayers((prevPlayers) =>
                    prevPlayers.some(player => player.player_id === newPlayer.player_id)
                        ? prevPlayers // Prevent duplicates
                        : [...prevPlayers, newPlayer]
                );
            } catch(error) {
                console.error('Error fetching username:', error.message);
                    return;

            }

        } 
        
    }

    const handleRemoveUser = async (payload) => {
        /*
         * Handles the removal of the user from the lobyy and updates the user list of the lobby
         * when a user leaves in the supabase tables
         * 
         */
        console.log('Remove user received:', payload);

        try {
            // fetch the latest list of players in the current game
            const { data: updatedPlayers, error } = await supabase
                .from('playergame')
                .select(`
                    *,
                    users (username, image_url)
                `)
                .eq('game_id', gameId);
    
            if (error) {
                console.error('Error fetching updated players:', error.message);
                return;
            }
    
            console.log('Updated players list from server:', updatedPlayers);
    
            // Update the players state with the new lis
            setPlayers(updatedPlayers);
        } catch (error) {
            console.error('Error during handleRemoveUser:', error.message);
        }
    };

    const startGameListener = async (payload) => {
        /*
         * when the game creator press start game the it will init a loading screen when
         * the 
         * 
         */
        if (payload.new.status === 'in_progress') {
            console.log('Game status changed to in_progress:', payload.new);
            setIsLoading(true);
        } else if (payload.new.status === 'active') {
            console.log('Game status change to in active', payload.new);
            console.log("Game started successfully");
            router.push('/games/MainGame')
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };

   
 
    useEffect(() => {
        const fetchPlayers = async () => {
            /*
             * function fetches the player data from their local storage, then fetches the data from the 
             * tables users, for the game_id and check if the user is the creator of the lobby game
             * and the game pin of the lobby. Then queries in the playergame table for the list of the unique id of the
             * game_id.
             */

            try {
  
    
                console.log('Starting fetchPlayers...');

                const getUserPayload = await getUserPayloadFromStorage();
                const userId = getUserPayload?.id;

                console.log('this is the userPayload:  ', getUserPayload);


                console.log("this is the user_id", userId);
    
    
                // start with here try to fix the realtime issue in the lobby
                const { data, error } = await supabase
                    .from('users')
                    .select(`*,
                             games (game_pin, id),
                             playergame (is_creator)
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
                setUserIsCreator(data?.playergame?.[0]?.is_creator);
    
                setGamePin(data?.games?.[0]?.game_pin);
                setGameId(data?.games?.[0]?.id || null);
                // else here
                const { data: gamePayload } = await supabase
                    .from('playergame')
                    .select(`
                        *,
                        users (username, image_url)
                        `)
                    .eq('game_id', gameId);

                console.log('this is the game Payload:  ', gamePayload);
    
                setPlayers(gamePayload);
    
            } catch(error) {
                console.log('Error fetching the players:  ', error.message);
                return;
            }
        };
        
        fetchPlayers();
        console.log('this is the game id: ', gameId);
    
        let channelLobby = supabase
        .channel('lobby_updates') 
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'playergame', filter: `game_id=eq.${gameId}` }, handlePLayerLobby)
        .subscribe();

        // Add logging to debug
        if (!channelLobby) {
            console.error('Failed to subscribe to lobby updates');
        }

        let removeUser = supabase.channel('custom-delete-channel')
        .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'playergame', filter: `game_id=eq.${gameId}` }, handleRemoveUser)
        .subscribe()

        let gameStatusListener = supabase
            .channel('game_status_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, startGameListener)
            .subscribe()

        return () => {
            supabase.removeChannel(channelLobby);
            supabase.removeChannel(removeUser);
            supabase.removeChannel(gameStatusListener);
        };
    
    }, [gameId]); 

    const handleExitLobby = async () => {
        /*
        this function gets the user_id from local storage and the game_id

        if the user is the creator it will remove the game then removing the playergame rows
        with the foriegn key of the games table

        else false it it remove the the player game row
        */

        // the player data
        console.log('this is the player data: ', localPlayerData);

        console.log('this is the player_id: ', localPlayerData?.id);
        console.log('this is the is_Creator', localPlayerData?.playergame?.[0]?.is_creator);

        if (localPlayerData?.playergame?.[0]?.is_creator) {
            const checkGameDelete = await deleteGame(gameId);

            if (!checkGameDelete.success) {
                console.log('Error', 'Game Deletion went unsuccesfull Lobby.jsx');
            } else {
                console.log('Succesfully deleted the game.')
            }

        }  else {
            deletePlayerGame(localPlayerData?.id, gameId);

            if (!checkGameDelete.success) {
                console.log('Error', 'Game Deletion went unsuccesfull Lobby.jsx');
            } else {
                console.log('Succesfully deleted the game.')
            }
        }

    };

    const handleStartGame = async () => {
        /*
         * this function handles the the game creator created the function
         * 
         */
        const result = await startGame(gameId, players);

    };

        
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
            {isLoading ? (
                <Loading/>
            ) : UserIsCreator ? (
                <Button 
                title='Start Game' 
                colors={theme.buttonGradient.success} 
                onPress={handleStartGame}
                />
            ) : (
                <Button 
                    title="Ready" 
                    colors={theme.buttonGradient.success} 
                    onPress={() => console.log('User is ready!')}
                />
            )}
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
