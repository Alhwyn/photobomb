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

export const handleRoundTable = async (game_id, prompter_id) => {
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
            .select("status, current_round")
            .eq("id", game_id)
            .single();

        if (gameError) {
            console.log("Error fetching game status: ", gameError.message);
            return { success: false, message: gameError.message};
        }

        // Calculate the next round number
        const nextRound = Math.floor(gameData.current_round ? gameData.current_round + 1 : 1);
        let roundPrompterID;

        // Get all players in this game, ordered by turn_order
        const { data: players, error: playerError } = await supabase
            .from("playergame")
            .select("id, player_id, turn_order")
            .eq("game_id", game_id)
            .order("turn_order", { ascending: true });

        if (playerError) {
            console.log("Error fetching player list: ", playerError.message);
            return { success: false, message: playerError.message };
        }

        const totalPlayers = players.length;

        if (gameData.status === "lobby") {
            // For the first round, use the provided prompter_id from the first player
            roundPrompterID = prompter_id;
        } else {
            // For subsequent rounds, find the current prompter and determine the next one
            const prompterIndex = players.findIndex(player => player.id === prompter_id);
            
            if (prompterIndex === -1) {
                console.log("Error: Current prompter not found in player list");
                return { success: false, message: "Current prompter not found" };
            }
            
            // Find the next player in turn order
            const nextPrompterIndex = (prompterIndex + 1) % totalPlayers;
            const nextPrompter = players[nextPrompterIndex];
            
            if (!nextPrompter) {
                console.log("Error determining the next prompter");
                return { success: false, message: "Unable to determine the next prompter" };
            }
            
            roundPrompterID = nextPrompter.id;
        }

        console.log("Creating new round with values:", {
            game_id,
            prompter_id: roundPrompterID,
            round: nextRound,
            total_players: totalPlayers,
        });

        // Create the new round entry
        const { data: roundData, error: roundError } = await supabase
            .from("round")
            .insert({
                game_id: game_id,
                prompter_id: roundPrompterID,
                round: nextRound,
                total_players: totalPlayers,
            })
            .select();

        if (roundError) {
            console.log("Error creating a new round:", roundError.message);
            return { success: false, message: roundError.message };
        }

        // Update the current round in the games table
        const { error: roundUpdateError } = await supabase
            .from("games")
            .update({ current_round: nextRound })
            .eq("id", game_id);

        if (roundUpdateError) {
            console.log("Error updating the game current round:", roundUpdateError.message);
            return { success: false, message: roundUpdateError.message };
        }

        // Delete any existing submissions for the previous round (if applicable)
        if (gameData.status !== "lobby") {
            console.log("Cleaning up previous round submissions...");
            
            const { data: previousRound, error: prevRoundError } = await supabase
                .from("round")
                .select("id")
                .eq("game_id", game_id)
                .eq("round", nextRound - 1)
                .single();
                
            if (!prevRoundError && previousRound) {
                // Delete previous round submissions
                const { error: deleteError } = await supabase
                    .from("submissions")
                    .delete()
                    .eq("round_id", previousRound.id);
                    
                if (deleteError) {
                    console.log("Warning: Failed to clean up previous submissions:", deleteError.message);
                    // Continue anyway - this is not critical
                } else {
                    console.log("Previous submissions cleaned up successfully");
                }
            }
        }

        // Create new submissions for all players except the prompter
        console.log("Creating submissions for new round...");
        
        // Log detailed information about players
        console.log("All players:", players.map(p => ({ id: p.id, turn_order: p.turn_order })));
        console.log("Prompter ID:", roundPrompterID);
        
        const nonPrompterPlayers = players.filter(player => player.id !== roundPrompterID);
        console.log("Players who need submissions:", nonPrompterPlayers.map(p => ({ id: p.id, turn_order: p.turn_order })));
        
        if (nonPrompterPlayers.length === 0) {
            console.log("Warning: No non-prompter players found to create submissions for");
        }
        
        const submissionPromises = nonPrompterPlayers.map(player => {
            console.log(`Creating submission for player ID: ${player.id}, round ID: ${roundData[0].id}`);
            return supabase
                .from("submissions")
                .insert({
                    round_id: roundData[0].id,
                    player_id: player.id,
                    photo_uri: null,
                    game_id: game_id,
                })
                .select();
        });

        const submissionResults = await Promise.all(submissionPromises);
        
        // Check if any submission inserts failed and log details
        const failedSubmissions = submissionResults.filter(result => result.error);
        if (failedSubmissions.length > 0) {
            console.log(`Warning: ${failedSubmissions.length} submission inserts failed`);
            failedSubmissions.forEach((result, index) => {
                console.log(`Failed submission ${index + 1}:`, result.error.message);
            });
            // Continue anyway - partial failure is better than total failure
        }
        
        // Log the successfully created submissions
        const successfulSubmissions = submissionResults.filter(result => !result.error && result.data);
        console.log(`Successfully created ${successfulSubmissions.length} submissions`);
        
        if (successfulSubmissions.length > 0) {
            console.log("Sample submission:", successfulSubmissions[0].data);
        }

        console.log("New round created successfully with prompter ID:", roundPrompterID);
        return { 
            success: true, 
            data: roundPrompterID, 
            round: nextRound,
            roundID: roundData[0].id
        };
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
            .eq("user_id", userId);

        if (error) {
            console.log("Error checking for duplicate game ID: ", error.message);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.log("Error in checkDuplicateGameId: ", error.message);
        return false;
    }
};

export const startNextRound = async (gameId) => {
    /*
     * Starts a new round for an existing game
     * - Finds the player with the next turn_order
     * - Updates the round table with the new prompter
     * - Creates new submissions for players
     * 
     * @param {string} gameId - ID of the game to start a new round for
     * @returns {Object} Result of the execution, including success and error if any
     */
    try {
        console.log("Starting next round for game:", gameId);
        
        // Get current game data
        const { data: gameData, error: gameError } = await supabase
            .from("games")
            .select("current_round")
            .eq("id", gameId)
            .single();

        if (gameError) {
            console.log("Error fetching game data:", gameError.message);
            return { success: false, message: gameError.message };
        }

        // Get the current round data to find the current prompter
        // Use limit(1) instead of single() to handle potential duplicate rounds
        const { data: roundDataArray, error: roundError } = await supabase
            .from("round")
            .select("prompter_id")
            .eq("game_id", gameId)
            .eq("round", gameData.current_round)
            .order('created_at', { ascending: false })
            .limit(1);

        if (roundError) {
            console.log("Error fetching current round:", roundError.message);
            return { success: false, message: roundError.message };
        }
        
        if (!roundDataArray || roundDataArray.length === 0) {
            console.log("No round data found for this game and round");
            return { success: false, message: "No round data found" };
        }
        
        const currentRound = roundDataArray[0];

        console.log("Current round data:", currentRound);
        console.log("Current prompter ID:", currentRound.prompter_id);
        
        // Check for and clean up duplicate rounds for the next round number before creating a new one
        const nextRoundNumber = gameData.current_round + 1;
        const { data: existingNextRounds, error: existingError } = await supabase
            .from("round")
            .select("id")
            .eq("game_id", gameId)
            .eq("round", nextRoundNumber);
            
        if (!existingError && existingNextRounds && existingNextRounds.length > 0) {
            console.log(`Found ${existingNextRounds.length} existing entries for round ${nextRoundNumber}. Cleaning up...`);
            
            // Delete these duplicate rounds before creating a new one
            for (const round of existingNextRounds) {
                // First delete any submissions associated with this round
                const { error: subDeleteError } = await supabase
                    .from("submissions")
                    .delete()
                    .eq("round_id", round.id);
                    
                if (subDeleteError) {
                    console.log(`Warning: Error deleting submissions for round ${round.id}:`, subDeleteError.message);
                }
                
                // Then delete the round itself
                const { error: roundDeleteError } = await supabase
                    .from("round")
                    .delete()
                    .eq("id", round.id);
                    
                if (roundDeleteError) {
                    console.log(`Warning: Error deleting round ${round.id}:`, roundDeleteError.message);
                }
            }
            
            console.log(`Cleaned up ${existingNextRounds.length} duplicate round entries`);
        }
        
        // Start the next round with the current prompter
        const result = await handleRoundTable(gameId, currentRound.prompter_id);
        
        if (!result.success) {
            return { success: false, message: result.message };
        }

        console.log("New round started successfully", result);
        return { 
            success: true, 
            data: {
                newPrompter: result.data,
                round: result.round
            }
        };
    } catch (error) {
        console.log("Error starting next round:", error.message);
        return { success: false, message: error.message };
    }
};