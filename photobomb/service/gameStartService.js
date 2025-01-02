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
        const shuffledPlayers = players
            .map((player) => ({...player, sortKey: Math.random() }))
            .sort((a, b) =>  a.sortKey - b.sortKey)
            .map((player, index) => ({
                id: player.id, 
                turn_order: index + 1, // Assign new turn order
            }));


        console.log("SHuffeld Players: ", shuffledPlayers);

        // Update only the turn_order in the playergame table
        const { error: turnOrderError } = await supabase
            .from('playergame')
            .upsert(shuffledPlayers, { onConflict: ["id"] });

        if (turnOrderError) {
            console.log('Error: assigning random turn orders: ', turnOrderError.message);
            return {success: false, message: turnOrderError.message};
        }

        console.log('Random turn order successfully assigned.');

        // update the game status to 'in_progress'
        const { error: statusError } = await supabase
            .from("games")
            .update({ status: "in_progress"})
            .eq("id", gameId)

        if (statusError) {
            console.log("Error updating the game status: ", statusError.message);
            return { success: false, message: statusError};
        }

        console.log("Game status updated to 'in_progress'")

        return {success: true};
    } catch(error) {
        console.log('Error on Starting Game: ', error.message);
        return {success: false, message: turnOrderError.message};
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

    try {

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
            
            const nextRound = gameData.current_round ? gameData.current_round + 1 : 1;

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
            
        }




    } catch (error) {
        console.log("Error in handleRoundtable: ", error.message);
        return { success: false, message: error.message};
    }
};
