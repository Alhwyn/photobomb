import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export const checkGamePin = async (pin) => {
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
        console.log('Game PIN exists: ', data);
        return {success: true, data: data};
    } catch(error) {
        console.log('Error checking PIN', error.message);
        return { success: false, msg: error.message};
    }

}
export const getGameId = async (userId) => {
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
    try {

        const { error } = await supabase
        .from('playerGame')
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
    try {

        const { data, error } = await supabase
        .from('playerGame')
        .select(`
            player_id,
            game_id,
            users (username, image_url),
            games (game_pin)
        `)
        .eq('player_id', userId)
        .single();

        if (error) {
            console.log('GameService.jsx Error when user joining the lobby: ', error.message);
            return {success: false, msg: error.message};
        }

        return {success: true, data: data};

    } catch(error) {
        console.log('GameService.jsx Error when user joining the lobby: ', error.message);
        return {success: false, msg: error.message};
    }

}

export const deletePlayerGame = async (playerId, gameId) => {
    try {
        const {data, error} = await supabase
        .from('playerGame')
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















