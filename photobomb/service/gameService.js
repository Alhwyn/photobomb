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
        .eq('game_creator', userId);
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
            return;
        }

        const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

        if (error) {
            console.error('Error deleting game: ', error.message);
            return;
            
        }
        console.log('Game deleted successfully')
    } catch(error) {
        console.error('gameService.js unexpected error while deteting the game: ', error.message);
    }
}

export const addUserToLobby = async (playerId, gameId) => {
    try {
        const {data, error} = await supabase
        .from('playerGame')
        .insert([
            {
                player_id: playerId,
                game_id: gameId,
                score: 0,
                turn_order: null,
            }
        ]);

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

export const checkUserInLobby = async (userId, gameId) => {
    try {

        const { data: playerData, error: playerError } = await supabase
        .from('playerGame')
        .select('id')
        .eq('player_id', userId)
        .eq('game_id', gameId)
        .single()

        if (playerError) {
            console.log('GameService.jsx Error when user joining the lobby: ', error.message);
            return {success: false, msg: error.message};
        }

        return {success: true, data: playerData};

    } catch(error) {
        console.log('GameService.jsx Error when user joining the lobby: ', error.message);
        return {success: false, msg: error.message};
    }

}

export const deletePlayerGame = async (playerId, gameId) => {
    try {
        const {data, error} = await supabase
        .form
    }
}















