import { supabase } from "../lib/supabase";

/*
 * this Script will do the following thing querying supabase with the following steps until 
 * 1) table (playergame) assign a randomize index of the for each of the following 
 *    playergame rows of the 
 * 
 * 2) create a round table of the game round 
 * 
 * 3) Once the round of the table then we update the round table of the players 
 *    with the status ( in_progress ) and will push the players into the game Screen
 */

export const startGame = async (gameId, players) => {
   /*
    * starts the game when the game creator presses the start button 
    * it start by assigning the turn_order index
    * and updating the game status 
    * @param {number} game - The id of the game to start.
    * @param {Array} player
    * @returns {Object} Result of the excecution, incuding success and error if any
    */

    try {

        // update the game status to 'in_progress'
        const { error: statusError } = await supabase
          .from("games")
          .update({ status: "in_progress"})
          .eq("id", gameId);

        if (statusError) {
            console.log("Error updating the game status: ", statusError.message);
            return { success: false, message: statusError};
        }

        console.log("Game status updated to 'in_progress'")

        // Get the actual database record IDs for each player
        // We need to fetch the actual playergame record IDs since presence data doesn't have them
        const { data: playerGameRecords, error: recordError } = await supabase
            .from('playergame')
            .select('id, player_id, turn_order')
            .eq('game_id', gameId);
            
        if (recordError) {
            console.error('Error fetching playergame records:', recordError.message);
            return { success: false, message: recordError.message };
        }
        
        // Create a map of player_id to actual database record id
        const playerIdToRecordMap = {};
        playerGameRecords.forEach(record => {
            playerIdToRecordMap[record.player_id] = record.id;
        });
        
        console.log("Player ID to Record Map:", playerIdToRecordMap);
        
        // Now map presence data to actual database records with proper IDs
        const shuffledPlayers = players
            .map((player) => ({...player, sortKey: Math.random() }))
            .sort((a, b) => a.sortKey - b.sortKey)
            .map((player, index) => {
                const recordId = playerIdToRecordMap[player.player_id];
                if (!recordId) {
                    console.warn(`No database record found for player_id: ${player.player_id}`);
                }
                return {
                    id: recordId, // Use the actual record ID from the database
                    game_id: gameId,
                    turn_order: index + 1, // Assign new turn order
                };
            })
            .filter(player => player.id); // Filter out any records without valid IDs

        console.log("Shuffled Players:", shuffledPlayers);

        // Update only the turn_order in the playergame table
        const { error: turnOrderError } = await supabase
            .from('playergame')
            .upsert(shuffledPlayers, { onConflict: ["id"] });

        if (turnOrderError) {
            console.error('Error: assigning random turn orders: ', turnOrderError.message);
            return {success: false, message: turnOrderError.message};
        }

        console.log('Random turn order successfully assigned.');

        // Get the first prompter based on the turn order we just assigned
        const { data: orderedPlayers, error: fetchOrderError } = await supabase
            .from('playergame')
            .select('id, player_id')
            .eq('game_id', gameId)
            .order('turn_order', { ascending: true })
            .limit(1);
            
        if (fetchOrderError) {
            console.error('Error fetching first prompter:', fetchOrderError.message);
            return { success: false, message: fetchOrderError.message };
        }
        
        const firstPrompterId = orderedPlayers?.[0]?.id;
        
        if (!firstPrompterId) {
            console.error("Error determining the first prompter.");
            return {success: false, message: "No players available to start the game."};
        }

        const roundTableResult = await handleRoundTable(gameId, firstPrompterId);
        if (!roundTableResult.success) {
            console.log("Error creating the round table: ", roundTableResult.message);
            return { success: false, message: roundTableResult};
        }

        console.log("First round table created succesfully");

        // update the game status to 'active'
        const { error: statusActiveError } = await supabase
          .from("games")
          .update({ status: "active"})
          .eq("id", gameId);

        if (statusActiveError) {
            console.error("Error updating the game status: ", statusError.message);
            return { success: false, message: statusError};
        }

        console.log("Game status updated to 'active'")

        return {success: true};
    } catch(error) {
        console.log('Error on Starting Game: ', error.message);
        return {success: false, message: error.message};
    }
};

const handleRoundTable = async (game_id, prompter_id) => {
    /*
     * This is the following table needs to create the round table in supabase
     * - game_id
     * - prompter_id
     * - round ( current round of game )
     * - total_players ( total players in the game )
     * 
     * Once the round table is create the game can start 
     * 
     * - Before creating the round table check if the game_id is in lobby
     * - if its not lobby then the round number and select the next prompter 
     * 
     */

    if (!game_id || !prompter_id) {
        console.log("Invalid input: game_id and prompter_id are required.");
        console.log("Received game_id:", game_id, "prompter_id:", prompter_id);
        return { success: false, message: "Invalid input for round table creation." };
    }

    try {

        // fetch the game data of the game_id
        const { data: gameData, error: gameError } = await supabase
            .from("games")
            .select("status")
            .eq("id", game_id)
            .single();

        if (gameError) {
            console.log("Error fetching game status: ", gameError.message);
            return { success: false, message: gameError.message};
        }

        if (gameData.status !== "lobby") {
            
            const nextRound = Math.floor(gameData.current_round ? gameData.current_round + 1 : 1);

            const {data: players, error: playerError} = await supabase
                .from("playergame")
                .select("id, turn_order")
                .eq("game_id", game_id)
                .order("turn_order", { ascending: true });

            if (playerError) {
                console.log("Error fethcing player list: ", playerError.message);
                return { success: false, message: playerError.message };
            }

            // Determine the next prompter
            const prompterIndex = players.findIndex(player => player.id === prompter_id);
            const nextPrompterIndex = (prompterIndex + 1) % players.length;
            const nextPrompterId = players[nextPrompterIndex];

            
            const totalPlayers = Math.floor(players.length);

            if (!nextPrompterId) {
                console.log("Error determining the next prompter: nextPrompter problem");
                return { success: false, message: "Unable to determine the next prompter"};
            }

            console.log("Preparing to insert into rounds with values:", {
                game_id,
                prompter_id: players[prompterIndex],
                round: nextRound,
                total_players: totalPlayers,
            });

            const { error: roundError} = await supabase
                .from("round")
                .insert({
                    game_id: game_id,
                    prompter_id: players[prompterIndex].id,
                    round: nextRound,
                    total_players: totalPlayers,
                });

            if (roundError) {
                console.log("Error creating a new round.", roundError.message);
                return {success: false, message: roundError.message};
            }

            // UPdate the games current round
            const { error: roundUpdateError } = await supabase
                .from("games")
                .update({ current_round: nextRound })
                .eq("id", game_id);

            if (roundUpdateError) {
                console.log("Error updating the game current round ", roundUpdateError.message);
                return {success: false, message: roundUpdateError.message};
            }

            console.log("New record created succesffuly with next prompter: ", nextPrompterId);
            return { success: true,  data: nextPrompterId, round: nextRound};
        }
    } catch (error) {
        console.log("Error in handleRoundtable: ", error.message);
        return { success: false, message: error.message};
    }
};


export const checkDuplicateGameId = async (userId) => {

    /*
     * Check if the user has already created a game with the same game_id
     * 
     * @param {number} userId - The id of the user to check.
     * @returns {boolean} - True if a duplicate game_id exists, false otherwise.
     */

    try {
        const { data, error } = await supabase
            .from("games")
            .select("id")
            .eq("user_id", userId)


        if (error) {
            console.log("Error checking for duplicate game ID: ", error.message);
            return false;
        }

       
    } catch (error) {
        console.log("Error in checkDuplicateGameId: ", error.message);
        return false;
    }
}