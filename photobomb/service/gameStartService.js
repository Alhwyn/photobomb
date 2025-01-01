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


