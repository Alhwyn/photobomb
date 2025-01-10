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
            console.log('Error checking game PIN: ', error.message);
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
            console.log('Failed to retrieve game connection', error.message);
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
        console.log(' the data user: ', payload);

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
            console.error('gameService.jsx: No game available to delete');
            return {success: true, message: 'gameService.jsx: No game available to delete'};
        }

        console.log('deleting the game id this is the id: ', gameId);
        const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

        if (error) {
            console.error('Error deleting game: ', error.message);
            return {success: true, message: 'Succesfully deleted the game from the game tables'};
            
        }
        return {success: true, message: 'Succesfully deleted the game from the game tables'};
    } catch(error) {
        console.error('gameService.js unexpected error while deteting the game: ', error.message);
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
            users (username, image_url),
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

export const deletePlayerGame = async (playerId, gameId) => {
    /**
     * deletes a player form the playergame table based on player and IDS
     * @param {string} playerId - The ID  of the player to delete.
     * @param {string} gameId - The ID of the game to remove the player from.
     * @returns {Promise<Object>} - An object indicating the success of the operationor an error message
     */
    try {

        console.log('playergame deleting here is the player_id: ', playerId);
        console.log('playergame deleting here is the user_id: ', gameId);
        const {data, error} = await supabase
        .from('playergame')
        .delete()
        .eq('player_id', playerId)
        .eq('game_id', gameId)


        if (error) {
            console.log('gameService.jsx Error on deleting player from PlayerGame: ', error.message);
            return {success: false, msg: error.message}
        }

        return {success: true, message: 'Succesfully deleted the game from the playerGames tables'};
    } catch(error) {
        console.log('gameService.jsx Error on deleting player from PlayerGame: ', error.message);
        return {success: false, msg: error.message}
    }
};

export const getRoundData = async (gameId) => {
    /**
     * fetches data for a specific game round from the round table
     * @param {string} gameId - The ID of the game to fetch round data for.
     * @returns {Promise<Object>} - an object indicating the success of the operationor an error message
     */
    try {
        const {data, error } = await supabase
          .from('round')
          .select('*')
          .eq('game_id', gameId)
          .single();

        if (error) {
            console.log('Error on fetching the data on the round table gameService.js', error.message);
            return {success: false, message: error.message};
        }

        console.log('successfully fetch the data fron the rounds table');

        return {success: true, data: data};
    } catch (error) {
        console.log('Error on fetching the data on the round table gameService.js', error.message);
        return {success: false, message: error.message};
    }
}















