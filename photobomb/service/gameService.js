import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export const checkGamePin = async (pin) => {
    /**
     * checks if a game with the provided game PIN exist in the database.
     * @params {string} pin = the game PIN to check.
     * @returns {Promise<Object>}- an obejct indication the success on the data retrieval
     */
    try {

        const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_pin', pin);
        if (error) {
            console.error('Error checking game PIN: ', error.message);
            return { success: false, msg: error.message};
        }
        if (!data || data.length === 0) {
            console.log(' No games found with this PIN.')
            return false;
        }
        console.log('Game PIN exists:  ', data);
        return {success: true, data: data};
    } catch(error) {
        console.log('Error checking PIN', error.message);
        return { success: false, msg: error.message};
    }
}
export const getGameId = async (userId) => {
    /**
     * retreives the game associated with a specific user ID ( game creator).
     * @params {string} userId - The ID of game creator.
     * @returns {Promise<Object>} - an obejct indication the success on the data retrieval
     * 
     */
    try {
        const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_creator', userId)
        .single();

        if (error) {
            console.error('Failed to retrieve game connection', error.message);
            return { success: false, msg: error.message};
        }
        if (!data || data.length === 0) {
            console.log('Failed to retrieve game connection')
            return {success: false, msg: "Can't find the game creator try again"};
        }
        return {success: true, data: data}
    } catch(error) {
        console.log('Error checking PIN', error.message);
        return { success: false, msg: error.message};
    }

}

export const CreateGameID = async (pin, payload) => {
    /**
     * creates a new game with the specified PIN and user paylaod as the game creator.
     * @param {string} pin - the game PIN to assign to the new game.
     * @param {Object} payload - The user payload containg user ID  and the other data
     * @returns {Promise<Object>} - an obejct indication the success on the data retrieval
     */

    try {
        console.log('Game PIN: ', pin);
        console.log('User data: ', payload);

        if (!payload?.id) {
            console.error('CreateGameID: No valid user ID in payload');
            return { success: false, msg: 'Invalid user data' };
        }

        // Check and delete any existing games created by this user
        const cleanupResult = await checkAndDeleteExistingGames(payload.id);
        console.log('Cleanup result:', cleanupResult);

        // Proceed with creating the new game
        const { error } = await supabase
        .from('games')
        .insert([
            {
                status: 'lobby',
                game_creator: payload?.id,
                game_pin: pin,
                current_round: 0,
            },
        ]);
        if (error) {
            console.log('Error Create game in Database', error.message);
            return { success: false, msg: error.message };
        }
        return {success: true, data: payload}
    } catch(error) {
        console.log('Error Create game in Database', error.message);
        return { success: false, msg: error.message };
    }

}

export const deleteGame = async (gameId) => {
    /**
     * deletes a game from the database by its ID
     * @param {string} gameId - The ID  of the game to delete
     * @reutrns {Promise<Object>} - an object indication the success on the data retrieval
     */
    try {
        if (!gameId) {
            console.log('gameService.jsx: No game available to delete');
            return {success: false, message: 'gameService.jsx: No game available to delete'};
        }

        console.log('Deleting game with ID:', gameId);
        const { data, error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

        if (error) {
            console.error('Error deleting game:', error.message);
            return {success: false, message: error.message};
        }
        
        console.log('Game successfully deleted');
        return {success: true, message: 'Successfully deleted the game from the database'};
    } catch(error) {
        console.error('gameService.js unexpected error while deleting the game:', error.message);
        return {success: false, message: error.message};
    }
}

export const addUserToLobby = async (playerId, gameId, isCreator) => {
    /**
     * add a user to the game lobby in the playergametable.
     * @param {string} playerId - the id of the palyer to add
     * @param {string} gameId - the id of teh game to join
     * @param {boolean} isCreator - whether the player is the game creator 
     * @returns {Promise<Object>} - an object indicatiing success of an error mesaage
     */
    try {

        const { error } = await supabase
        .from('playergame')
        .insert([
            {
                player_id: playerId,
                game_id: gameId,
                score: 0,
                turn_order: null,
                is_creator: isCreator,
            },
        ]);


        if (error) {
            console.log('GameService.jsx Error when user joining the lobby: ', error.message);
            return {success: false, msg: error.message};
        }

        return {success: true}
       
    } catch(error) {
        console.log('GameService.jsx Error when user joining the lobby: ', error.message);
        return {success: false, msg: error.message};
    }
}

export const checkUserInLobby = async (userId) => {
    /**
     * ckecks if a user is in the game lobby and retrieves their associated data.
     * @param {string} userId - The ID of the user to check in the lobby
     * @returns {Promise<Object>} - an object indicating the success of the operation  and the user/game data if found
     * 
     * the function queries the `playergame` table to check if teh user  is in the lobby  and retreives:
     * - `player_id` - the ID of the player
     * - `game_id` - the ID of the game the user is part of
     * - `users` (joined data) - the user's `username` and `image_url`
     * - `games` (joined data) - The `game_pin` of the game the user is associated with.
     * 
     * 
     */
    
    try {

        const { data, error } = await supabase
        .from('playergame')
        .select(`
            player_id,
            game_id,
            score,
            users (username, image_url, id),
            games (game_pin)
        `)
        .eq('player_id', userId)
        .single();

        if (error) {
            console.log('GameService.jsx Error when user joining the lobby:  ', error.message);
            return {success: false, msg: error.message};
        }

        return {success: true, data: data};

    } catch(error) {
        console.log('GameService.jsx Error when user joining the lobby: ', error.message);
        return {success: false, msg: error.message};
    }

}


export const getPlayerGame = async (player_id) => {
    /**
     * retrieves the game data for a specific player from the playergame table
     * @param {string} player_id - The ID of the player to fetch game data for.
     * @returns {Promise<Object>} - an object indicating the success of the operationor an error message
     */
    try {
        const {data, error} = await supabase
        .from('playergame')
        .select('*')
        .eq('id', player_id)
        .single();

        if (error) {
            console.error('Error on fetching the data on the playergame table gameService.js', error.message);
            return {success: false, message: error.message};
        }

        console.log('successfully fetch the data fron the playergame table');

        return {success: true, data: data};
    } catch (error) {
        console.log('Error on fetching the data on the playergame table gameService.js', error.message);
        return {success: false, message: error.message};
    }

}

export const deletePlayerGame = async (playerId, gameId) => {
    /**
     * deletes a player form the playergame table based on player and IDS
     * @param {string} playerId - The ID  of the player to delete.
     * @param {string} gameId - The ID of the game to remove the player from.
     * @returns {Promise<Object>} - An object indicating the success of the operationor an error message
     */
    try {
        if (!playerId || !gameId) {
            console.error('Missing required parameters: playerId or gameId');
            return { success: false, message: 'Missing required parameters' };
        }

        console.log('Removing player from game - Player ID:', playerId, 'Game ID:', gameId);
        const { data, error } = await supabase
            .from('playergame')
            .delete()
            .eq('player_id', playerId)
            .eq('game_id', gameId);

        if (error) {
            console.error('Error removing player from game:', error.message);
            return { success: false, message: error.message };
        }

        console.log('Player successfully removed from game');
        return { success: true, message: 'Successfully removed player from game' };
    } catch (error) {
        console.error('Unexpected error removing player from game:', error.message);
        return { success: false, message: error.message };
    }
};

export const getRoundData = async (gameId) => {
    /**
     * fetches data for a specific game round with optimized query
     * @param {string} gameId - The ID of the game to fetch round data for.
     * @returns {Promise<Object>} - an object indicating the success of the operation or an error message
     */
    try {
        const { data: gameData, error } = await supabase
            .from('games')
            .select(`*,
                    round (id, round, prompter_id, created_at)`)
            .eq('id', gameId)
            .order('round', { foreignTable: 'round', ascending: false })
            .limit(1, { foreignTable: 'round' });

        if (error) {
            console.error('Error fetching round data:', error.message);
            return { success: false, message: error.message };
        }
        
        if (!gameData || gameData.length === 0 || !gameData[0].round || gameData[0].round.length === 0) {
            console.error('No round data found for this game');
            return { success: false, message: 'No round data found' };
        }

        console.log('Successfully fetched the data from the rounds table');

        return { success: true, data: gameData[0].round[0] };
    } catch (error) {
        console.log('Error on fetching the data on the round table gameService.js', error.message);
        return { success: false, message: error.message };
    }
}


export const getSubmissionData = async (game_id) => {
    /**
     * fetches data for a specific submission round from the round table with optimized single query
     * @param {string} game_id - The ID of the game to fetch round data for.
     * @returns {Promise<Object>} - an object indicating the success of the operation or an error message
     */

    try {
        // Single optimized query to fetch game, round, and submissions data
        const { data: gameData, error: roundError } = await supabase
            .from('games')
            .select(`*,
                    round (id, round, prompter_id, created_at),
                    submissions (id, player_id, photo_uri, created_at, round_id)`)
            .eq('id', game_id)
            .order('round', { foreignTable: 'round', ascending: false })
            .limit(1, { foreignTable: 'round' });

        if (roundError) {
            console.error('Error fetching game and round data:', roundError.message);
            return { success: false, message: roundError.message };
        }
        
        if (!gameData || gameData.length === 0 || !gameData[0].round || gameData[0].round.length === 0) {
            console.error('No round data found for this game');
            return { success: false, message: 'No round data found' };
        }
        
        const roundData = gameData[0].round[0];
        const allSubmissions = gameData[0].submissions || [];
        console.log(`Getting submissions for game ${game_id}, round ${roundData.round}, round ID: ${roundData.id}`);

        // Filter submissions for the current round from the fetched data
        const currentRoundSubmissions = allSubmissions.filter(sub => sub.round_id === roundData.id);

        // Check for duplicate submissions for the same player in this round
        if (currentRoundSubmissions && currentRoundSubmissions.length > 0) {
            // Group submissions by player_id to find duplicates
            const submissionsByPlayer = {};
            currentRoundSubmissions.forEach(sub => {
                if (!submissionsByPlayer[sub.player_id]) {
                    submissionsByPlayer[sub.player_id] = [];
                }
                submissionsByPlayer[sub.player_id].push(sub);
            });
            
            // Check for players with multiple submissions
            const playersWithDuplicates = Object.keys(submissionsByPlayer).filter(
                playerId => submissionsByPlayer[playerId].length > 1
            );
            
            if (playersWithDuplicates.length > 0) {
                console.log(`Found ${playersWithDuplicates.length} players with duplicate submissions. Cleaning up...`);
                
                // For each player with duplicates, keep only the most recent submission
                for (const playerId of playersWithDuplicates) {
                    const playerSubs = submissionsByPlayer[playerId];
                    console.log(`Player ${playerId} has ${playerSubs.length} submissions`);
                    
                    // Sort by created_at, most recent first
                    playerSubs.sort((a, b) => 
                        new Date(b.created_at) - new Date(a.created_at)
                    );
                    
                    // Keep the first (most recent), delete the rest
                    for (let i = 1; i < playerSubs.length; i++) {
                        console.log(`Deleting duplicate submission id: ${playerSubs[i].id}`);
                        const { error: deleteError } = await supabase
                            .from('submissions')
                            .delete()
                            .eq('id', playerSubs[i].id);
                            
                        if (deleteError) {
                            console.log(`Warning: Error deleting duplicate submission ${playerSubs[i].id}:`, deleteError.message);
                        }
                    }
                }
            }
        }

        // Now get submissions for the current round with detailed player information
        const { data, error } = await supabase
          .from('submissions')
          .select(`*,
                   playergame (id, score, player_id, is_creator, users(username, image_url))
                `)
          .eq('round_id', roundData.id)
          .order('created_at', { ascending: false });

        if (error) {
            console.error('Error on fetching the data on the submission table gameService.js', error.message);
            return {success: false, message: error.message};
        }

        console.log(`Successfully fetched ${data ? data.length : 0} submissions for round ID: ${roundData.id}`);

        return {success: true, data: data};

    } catch (error) {
        console.log('Error on fetching the data on the round table gameService.js', error.message);
        return {success: false, message: error.message};
    }
}

export const updateUserScore = async (player_id, game_id, current_score) => {
    /**
     * Increments the score of a user in the playergame table.
     * @param {string} player_id - The ID of the player whose score to update.
     * @param {string} game_id - The ID of the game associated with the player.
     * @param {number} incrementBy - The amount to increment the score by (default is 1).
     * @returns {Promise<Object>} - An object indicating the success of the operation or an error message.
     */
    try {
        const { data, error } = await supabase
            .from('playergame')
            .update({ score: current_score+1 }) // Increment the score
            .eq('game_id', game_id)
            .eq('id', player_id);
            

        console.log('data from the update user score: ', data);

        if (error) {
            console.log('Error incrementing user score: ', error.message);
            return { success: false, msg: error.message };
        }

        return { success: true, data: data };
    } catch (error) {
        console.log('Error incrementing user score: ', error.message);
        return { success: false, msg: error.message };
    }
};

export const checkAndDeleteExistingGames = async (userId) => {
    /**
     * Checks if a user has any existing games as a creator and deletes them
     * @param {string} userId - The ID of the user to check for existing games
     * @returns {Promise<Object>} - An object indicating the success of the operation or an error message
     */
    try {
        if (!userId) {
            console.error('gameService.js: No user ID provided to checkAndDeleteExistingGames');
            return {success: false, message: 'No user ID provided'};
        }

        console.log('Checking for existing games created by user:', userId);
        
        // First, query for existing games created by this user
        const { data, error } = await supabase
            .from('games')
            .select('id, status, game_pin')
            .eq('game_creator', userId);

        if (error) {
            console.error('Error checking for existing games:', error.message);
            return {success: false, message: error.message};
        }
        
        if (!data || data.length === 0) {
            console.log('No existing games found for user:', userId);
            return {success: true, message: 'No existing games found'};
        }
        
        console.log(`Found ${data.length} existing games for user:`, data);
        
        // Delete each game found
        let deletedGames = 0;
        for (const game of data) {
            console.log(`Deleting existing game with ID: ${game.id}, PIN: ${game.pin}, Status: ${game.status}`);
            
            // First update status to terminated to notify any connected players
            const { error: updateError } = await supabase
                .from('games')
                .update({ status: 'terminated' })
                .eq('id', game.id);
                
            if (updateError) {
                console.error(`Error setting game ${game.id} status to terminated:`, updateError.message);
            }
            
            // Small delay to ensure status update is processed by any listeners
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Delete the game
            const { error: deleteError } = await supabase
                .from('games')
                .delete()
                .eq('id', game.id);
                
            if (deleteError) {
                console.error(`Error deleting game ${game.id}:`, deleteError.message);
            } else {
                deletedGames++;
            }
        }
        
        return {
            success: true, 
            message: `Successfully deleted ${deletedGames} of ${data.length} existing games`,
            deletedCount: deletedGames,
            totalFound: data.length
        };
    } catch (error) {
        console.error('Unexpected error in checkAndDeleteExistingGames:', error.message);
        return {success: false, message: error.message};
    }
};

export const getGameDataOptimized = async (game_id) => {
    /**
     * Fetches all game data (round, submissions, players) in a single optimized query
     * @param {string} game_id - The ID of the game to fetch data for.
     * @returns {Promise<Object>} - Complete game data or error message
     */
    try {
        const { data: gameData, error } = await supabase
            .from('games')
            .select(`*,
                    round (id, round, prompter_id, created_at),
                    submissions (
                        id, 
                        player_id, 
                        photo_uri, 
                        created_at, 
                        round_id,
                        playergame (
                            id, 
                            score, 
                            player_id, 
                            is_creator, 
                            users(username, image_url)
                        )
                    ),
                    playergame (
                        id,
                        player_id,
                        score,
                        is_creator,
                        users(id, username, image_url)
                    )`)
            .eq('id', game_id)
            .order('round', { foreignTable: 'round', ascending: false })
            .limit(1, { foreignTable: 'round' });

        if (error) {
            console.error('Error fetching optimized game data:', error.message);
            return { success: false, message: error.message };
        }

        if (!gameData || gameData.length === 0) {
            console.error('No game data found');
            return { success: false, message: 'Game not found' };
        }

        const game = gameData[0];
        const currentRound = game.round?.[0];
        const allSubmissions = game.submissions || [];
        const players = game.playergame || [];

        // Filter submissions for current round
        const currentRoundSubmissions = currentRound 
            ? allSubmissions.filter(sub => sub.round_id === currentRound.id)
            : [];

        console.log(`Optimized fetch: Game ${game_id}, Round ${currentRound?.round}, ${currentRoundSubmissions.length} submissions, ${players.length} players`);

        return {
            success: true,
            data: {
                game,
                currentRound,
                submissions: currentRoundSubmissions,
                players,
                allSubmissions
            }
        };

    } catch (error) {
        console.log('Error in optimized game data fetch:', error.message);
        return { success: false, message: error.message };
    }
};












