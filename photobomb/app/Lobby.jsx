import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState, useRef } from 'react';
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import UserLobby from '../components/UserLobby'
import Button from '../components/Button' 
import { deleteGame, deletePlayerGame } from '../service/gameService';
import { getUserPayloadFromStorage } from '../service/userService';
import ExitButton from '../components/ExitButton';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { startGame,  } from '../service/gameStartService';
import Loading from '../components/Loading';


const Lobby = () => {
    const router = useRouter();
    const [gamePin, setGamePin] = useState(null);
    const [players, setPlayers] = useState([]);
    const [gameId, setGameId] = useState(null);
    const [localPlayerData, getLocalPLayerData] = useState(null);
    const [UserIsCreator, setUserIsCreator] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const presenceChannelRef = useRef(null);

    const setStateLobby = async () => {

        try {
            console.log('Initializing lobby state...');

            const getUserPayload = await getUserPayloadFromStorage();
            const userId = getUserPayload?.id;

            if (!userId) {
                console.error('User ID is null. Cannot fetch lobby state.');
                return { success: false, message: 'User ID is missing' };
            }

            console.log("this is the user_id", userId);

            // start with here try to fix the realtime issue in the lobby
            const { data, error } = await supabase
                .from('playergame')
                .select(`*,
                        games (game_pin, id, game_creator, created_at)
                `)
                .eq('player_id', userId)
                .order('created_at', { ascending: false }) 
                .limit(1) 
                .single();

            console.log('Fetched most recent user game:', data);

            setGameId(data.game_id);
            setGamePin(data.games.game_pin);
            getLocalPLayerData(getUserPayload);
            setUserIsCreator(data.is_creator);

            return {success: true, message: 'data success'};

        } catch(error) {
            console.error('There is an error on setStateLobbyFunction: ', error.message);
            return {success: false, message: 'data success'};
        }
    }

    const startGameListener = async (payload) => {
        /*
         * Listen for game status changes:
         * - "in_progress": Show loading screen
         * - "active": Navigate to MainGame
         * - "terminated": Navigate back (kicked out) with message
         */
        if (payload.new.status === 'in_progress') {
            console.log('Game status changed to in_progress:', payload.new);
            setIsLoading(true);
        } else if (payload.new.status === 'active') {
            console.log('Game status changed to active:', payload.new);
            console.log("Game started successfully");
            router.push('/games/MainGame');
            setIsLoading(false);
        } else if (payload.new.status === 'terminated') {
            console.log('Game has been terminated by the creator:', payload.new);
            // Only show alert if we're not the one who terminated it
            if (UserIsCreator !== localPlayerData?.id) {
                alert('The game has been ended by the creator');
            }
            router.replace('Main');
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
                if (!gameId) {
                    await setStateLobby();
                    return; // Exit and let the useEffect run again when gameId updates
                }

                console.log('Fetching players for game ID:', gameId);
                


            
                const { data: gamePayload, error } = await supabase
                    .from('playergame')
                    .select(`
                        *,
                        users (username, image_url)
                    `)
                    .eq('game_id', gameId);


                if (error) {
                    console.error('Error fetching players:', error.message);
                    return;
                }

                console.log('Players payload:', gamePayload);
            
                if (gamePayload && gamePayload.length > 0) {
                    setPlayers(gamePayload);
                } else {
                    console.log('No players found for game ID:', gameId);
                }
    
            } catch(error) {
                console.error('Error fetching the players:  ', error.message);
                return;
            }
        };
        
        fetchPlayers();
        console.log('this is the game id: ', gameId);

        if (!gameId) {

            const setUsersetStateLobby = setStateLobby();

            if (!setUsersetStateLobby) {
                console.error('Thier is an error in setStateLobby');
            }
        }
    
        let gameStatusListener = supabase
            .channel('game_status_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, startGameListener)
            .subscribe()

        // --- Presence Feature ---
        let isMounted = true;
        let userPayload = null;

        const setupPresence = async () => {
            userPayload = await getUserPayloadFromStorage();
            if (!gameId || !userPayload) return;

            // Clean up previous channel if any
            if (presenceChannelRef.current) {
                supabase.removeChannel(presenceChannelRef.current);
            }

            const channel = supabase.channel(`lobby-presence-${gameId}`, {
                config: { presence: { key: userPayload.id.toString() } }
            });

            channel
                .on('presence', { event: 'sync' }, async () => {
                    const state = channel.presenceState();
                    // Flatten the state to get all online users with their info
                    const users = Object.values(state).flat();
                    // Map to objects with username, image_url, and is_creator
                    const onlineUserObjects = users.map(u => ({
                        player_id: u.user_id, // Using user_id directly as this corresponds to player_id in the DB
                        users: {
                            username: u.username || '',
                            image_url: u.image_url || '',
                        },
                        is_creator: !!u.is_creator,
                    }));
                    console.log('Online users (presence sync):', onlineUserObjects);
                    if (isMounted) setOnlineUsers(onlineUserObjects);
                })
                .on('presence', { event: 'leave' }, ({ key, newPresences }) => {
                    console.log(`User ${key} has left the lobby`);
                    // The sync event will automatically update the list, but we could update manually here if needed
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            user_id: userPayload.id,
                            username: userPayload.username,
                            image_url: userPayload.image_url,
                            is_creator: UserIsCreator,
                        });
                    }
                });
            presenceChannelRef.current = channel;
        };

        setupPresence();

        return () => {
            isMounted = false;
            if (presenceChannelRef.current) {
                supabase.removeChannel(presenceChannelRef.current);
                presenceChannelRef.current = null;
            }
            supabase.removeChannel(gameStatusListener);
        };
    
    }, [gameId]); 

    const handleExitLobby = async () => {
        /*
        This function handles a player exiting the lobby:
        
        If the user is the creator:
        - Updates game status to "terminated" to notify other players
        - Removes the game entirely from the database, which will cascade to player records
        - All players will be kicked out
        
        If the user is not the creator:
        - Simply removes their player record from the game
        */

        try {
            console.log('Player exiting lobby...');
            
            // First, leave the presence channel to update online users immediately
            if (presenceChannelRef.current) {
                await presenceChannelRef.current.untrack();
                console.log('Successfully untracked user from presence');
            }

            console.log('Player data:', localPlayerData);
            console.log('Player ID:', localPlayerData?.id);
            console.log('Is Creator:', UserIsCreator);

            if (UserIsCreator === localPlayerData?.id) {
                console.log('Creator is leaving the game - will terminate the game for all players');
                
                // First update game status to "terminated" to trigger notifications for other players
                const { error: updateError } = await supabase
                    .from('games')
                    .update({ status: 'terminated' })
                    .eq('id', gameId);
                
                if (updateError) {
                    console.error('Error setting game status to terminated:', updateError.message);
                } else {
                    console.log('Game status updated to terminated');
                }

                // Small delay to ensure status update is processed
                await new Promise(resolve => setTimeout(resolve, 500));

                // Delete the game row, which should cascade delete all player records
                const checkGameDelete = await deleteGame(gameId);

                if (!checkGameDelete || !checkGameDelete.success) {
                    console.error('Error: Game deletion was unsuccessful');
                } else {
                    console.log('Successfully deleted the game row and all related player records');
                }
            } else {
                const deleteResult = await deletePlayerGame(localPlayerData?.id, gameId);

                if (!deleteResult || !deleteResult.success) {
                    console.error('Error: Player removal was unsuccessful');
                } else {
                    console.log('Successfully removed player from game');
                }
            }

            router.replace('Main');
        } catch(error) {
            console.error('Error in handleExitLobby:', error.message);
            router.replace('Main');
        }
    };
    const handleStartGame = async () => {
        /*
         * this function handles the the game creator created the function
         * 
         */
        try {
            if (onlineUsers.length < 2) {
                alert('You need at least 2 players to start the game');
                return;
            }
            
            console.log('Starting game with players:', onlineUsers);
            
            // Use onlineUsers from Presence for the most up-to-date list of active players
            const result = await startGame(gameId, onlineUsers);
            
            if (!result.success) {
                console.error('Error starting game:', result.message);
                alert('Failed to start the game. Please try again.');
            }
        } catch (error) {
            console.error('Unexpected error starting game:', error.message);
            alert('An error occurred while starting the game.');
        }
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
            lobbyData={onlineUsers}
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
