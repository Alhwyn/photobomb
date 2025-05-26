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

        // const roundTableResult = await handleRoundTable(gameId, firstPrompterId); // OLD
        const roundTableResult = await handleRoundTable(gameId, firstPrompterId, 1); // NEW: Pass round_to_create as 1
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

export const handleRoundTable = async (game_id, prompter_id_of_previous_round, round_to_create) => {
    /*
     * This is the following table needs to create the round table in supabase
     * - game_id
     * - prompter_id (for the round_to_create)
     * - round (round_to_create)
     * - total_players ( total players in the game )
     *
     * @param {string} game_id - ID of the game.
     * @param {string} prompter_id_of_previous_round - playergame.id of the prompter for the round before round_to_create, or the first prompter if round_to_create is 1.
     * @param {number} round_to_create - The specific round number to create.
     */

    if (!game_id || !prompter_id_of_previous_round || !round_to_create) {
        console.log("Invalid input: game_id, prompter_id_of_previous_round, and round_to_create are required.");
        console.log("Received game_id:", game_id, "prompter_id_of_previous_round:", prompter_id_of_previous_round, "round_to_create:", round_to_create);
        return { success: false, message: "Invalid input for round table creation." };
    }

    try {
        // Get all players in this game, ordered by turn_order (MOVED UP)
        const { data: players, error: playerError } = await supabase
            .from("playergame")
            .select("id, player_id, turn_order") // 'id' here is playergame.id
            .eq("game_id", game_id)
            .order("turn_order", { ascending: true });

        if (playerError) {
            console.error("Error fetching players:", playerError.message);
            return { success: false, message: `Error fetching players: ${playerError.message}` };
        }
        if (!players || players.length === 0) {
            console.error("No players found for this game or player list is empty.");
            return { success: false, message: "No players found for this game." };
        }
        const totalPlayers = players.length;

        let roundIdToUse;
        let prompterIdForThisRound;
        let wasRoundJustCreated = false;

        // Check if this specific round_to_create already exists.
        const { data: existingRound, error: existingRoundErrorCheck } = await supabase
            .from("round")
            .select("id, prompter_id")
            .eq("game_id", game_id)
            .eq("round", round_to_create)
            .order('created_at', { ascending: false })
            .limit(1);

        if (existingRoundErrorCheck) {
            console.error("Error checking for existing round:", existingRoundErrorCheck.message);
            return { success: false, message: `Error checking for existing round: ${existingRoundErrorCheck.message}` };
        }

        if (existingRound && existingRound.length > 0) {
            console.warn(`Round ${round_to_create} for game ${game_id} already exists. Using existing round ID: ${existingRound[0].id}`);
            roundIdToUse = existingRound[0].id;
            prompterIdForThisRound = existingRound[0].prompter_id;
        } else {
            // Round does not exist, proceed to create it.
            if (round_to_create === 1) {
                prompterIdForThisRound = prompter_id_of_previous_round; // This is the first prompter's playergame.id
            } else {
                const previousPrompterDetails = players.find(p => p.id === prompter_id_of_previous_round);
                if (!previousPrompterDetails) {
                    console.error(`Could not find previous prompter (ID: ${prompter_id_of_previous_round}) in player list for game ${game_id}.`);
                    return { success: false, message: "Failed to determine next prompter: previous prompter not found." };
                }
                const previousPrompterTurnOrder = previousPrompterDetails.turn_order;
                // Find the player with the next turn_order. If no one has a greater turn_order, wrap around to the first player.
                let nextPlayer = players.find(p => p.turn_order > previousPrompterTurnOrder);
                if (nextPlayer) {
                    prompterIdForThisRound = nextPlayer.id;
                } else {
                    // Wrap around to the player with the lowest turn_order
                    prompterIdForThisRound = players[0].id;
                }
            }

            if (!prompterIdForThisRound) {
                console.error("Failed to determine the new prompter for the round.");
                return { success: false, message: "Failed to determine new prompter." };
            }

            console.log("Creating new round with values:", {
                game_id,
                prompter_id: prompterIdForThisRound,
                round: round_to_create,
                total_players: totalPlayers,
            });

            // Create the new round entry
            const { data: roundData, error: roundError } = await supabase
                .from("round")
                .insert({
                    game_id: game_id,
                    prompter_id: prompterIdForThisRound,
                    round: round_to_create,
                    total_players: totalPlayers,
                })
                .select("id, prompter_id") // Explicitly select fields needed
                .single();

            if (roundError) {
                console.error("Error creating new round:", roundError.message);
                return { success: false, message: `Error creating new round: ${roundError.message}` };
            }
            if (!roundData) {
                console.error("New round data is null after insert despite no error.");
                return { success: false, message: "Failed to create new round (no data returned)." };
            }
            
            roundIdToUse = roundData.id;
            // Ensure prompterIdForThisRound matches what's in DB, though it should by design of insert
            if (prompterIdForThisRound !== roundData.prompter_id) {
                 console.warn(`Prompter ID mismatch. Determined: ${prompterIdForThisRound}, DB: ${roundData.prompter_id}. Using DB value.`);
                 prompterIdForThisRound = roundData.prompter_id;
            }
            wasRoundJustCreated = true;
        }
        
        // Update the current round in the games table (always perform this)
        const { error: roundUpdateError } = await supabase
            .from("games")
            .update({ current_round: round_to_create })
            .eq("id", game_id);

        if (roundUpdateError) {
            console.error("Error updating game's current_round:", roundUpdateError.message);
            // Decide if this is fatal. For now, log and continue.
            // return { success: false, message: `Error updating game's current_round: ${roundUpdateError.message}` };
        }

        // Delete any existing submissions for the *actual previous round* (only if this round was just created)
        if (wasRoundJustCreated && round_to_create > 1) {
            const { data: prevRoundInfo, error: prevRoundError } = await supabase
                .from("round")
                .select("id")
                .eq("game_id", game_id)
                .eq("round", round_to_create - 1)
                .order('created_at', { ascending: false })
                .limit(1);

            if (prevRoundError) {
                console.error(`Error fetching previous round (round ${round_to_create - 1}) for submission cleanup:`, prevRoundError.message);
            } else if (prevRoundInfo && prevRoundInfo.length > 0) {
                const previousRoundId = prevRoundInfo[0].id;
                console.log(`Cleaning up submissions from previous round ID: ${previousRoundId} (logical round ${round_to_create - 1})`);
                const { error: deleteError } = await supabase
                    .from("submissions")
                    .delete()
                    .eq("round_id", previousRoundId);

                if (deleteError) {
                    console.error("Error deleting old submissions:", deleteError.message);
                } else {
                    console.log(`Successfully deleted submissions for previous round ${round_to_create - 1}.`);
                }
            } else {
                console.log(`No previous round (round ${round_to_create - 1}) found to clean up submissions from.`);
            }
        }


        // Create new submissions for all players except the prompter
        console.log("Managing submissions for current round...");
        console.log("All players in game:", players.map(p => ({ id: p.id, turn_order: p.turn_order })));
        console.log("Prompter ID for this round:", prompterIdForThisRound);
        
        const nonPrompterPlayers = players.filter(player => player.id !== prompterIdForThisRound);
        console.log("Players who need submissions (non-prompters):", nonPrompterPlayers.map(p => ({ id: p.id, turn_order: p.turn_order })));
        
        if (nonPrompterPlayers.length === 0 && players.length > 1) {
            console.warn("No non-prompter players found to create submissions for, but there are multiple players in the game. This might be an issue.");
            // This situation might be normal if it's a 1-player game (though typically games need >1)
            // or if prompterIdForThisRound somehow matches all player.id, which would be a bug.
        }
        
        // First check for and clean up any existing submissions for this roundIdToUse to avoid duplicates (belt and braces)
        const { data: existingSubmissions, error: existingSubmError } = await supabase
            .from("submissions")
            .select("id, player_id")
            .eq("round_id", roundIdToUse);
            
        if (existingSubmError){
            console.error(`Error checking for existing submissions for round ${roundIdToUse}:`, existingSubmError.message);
            return { success: false, message: `Error checking existing submissions: ${existingSubmError.message}` };
        }

        if (existingSubmissions && existingSubmissions.length > 0) {
            console.warn(`Found ${existingSubmissions.length} existing submissions for round ID ${roundIdToUse}. Cleaning them up before creating new ones.`);
            const { error: deleteExistingSubmError } = await supabase
                .from("submissions")
                .delete()
                .eq("round_id", roundIdToUse);
            if (deleteExistingSubmError) {
                console.error(`Failed to clean up existing submissions for round ${roundIdToUse}:`, deleteExistingSubmError.message);
                return { success: false, message: `Failed to clean up existing submissions for round ${roundIdToUse}.` };
            }
        }
        
        // Now create fresh submissions for all non-prompter players
        const submissionPromises = nonPrompterPlayers.map(player => {
            return supabase.from("submissions").insert({
                game_id: game_id,
                round_id: roundIdToUse,
                player_id: player.id,
            }).select(); // Ensure you select the created record if needed later
        });

        const submissionResults = await Promise.all(submissionPromises);
        
        const failedSubmissions = submissionResults.filter(result => result.error);
        if (failedSubmissions.length > 0) {
            console.error("Some submissions failed to create:", failedSubmissions.map(f => f.error.message));
            // Decide if this is a critical failure for the round
        }
        
        const successfulSubmissions = submissionResults.filter(result => !result.error && result.data);
        console.log(`Successfully created ${successfulSubmissions.length} submissions for round ${round_to_create} (ID: ${roundIdToUse})`);
        
        if (successfulSubmissions.length > 0) {
             console.log("Sample submission:", successfulSubmissions[0].data);
        }

        console.log(`New round ${round_to_create} created successfully with prompter ID: ${prompterIdForThisRound}`);
        return { 
            success: true, 
            data: prompterIdForThisRound, // This is the prompter for the round_to_create
            round: round_to_create,
            roundID: roundIdToUse
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
        console.log("=========== STARTING NEXT ROUND ===========");
        console.log("Starting next round for game:", gameId);
        
        // Get current game data with status check
        const { data: gameData, error: gameError } = await supabase
            .from("games")
            .select("current_round, status")
            .eq("id", gameId)
            .single();

        if (gameError) {
            console.log("Error fetching game data:", gameError.message);
            return { success: false, message: gameError.message, gameId: gameId };
        }
        
        // Early exit if game is completed or not active
        if (gameData.status === 'completed' || gameData.status === 'terminated') {
            console.log("Game is already completed or terminated, skipping round transition");
            return { success: false, message: "Game is not active" };
        }
        
        // Check if the next round already exists (indicating another process already created it)
        const nextRoundCheck = gameData.current_round + 1;
        const { data: existingNextRoundData, error: existingRoundError } = await supabase
            .from("round")
            .select("id, round, prompter_id") // Consider joining to get more prompter info if needed client-side
            .eq("game_id", gameId)
            .eq("round", nextRoundCheck)
            .maybeSingle(); // Use maybeSingle to handle null result gracefully
            
        if (existingRoundError && existingRoundError.code !== 'PGRST116') { // PGRST116 means 0 rows, not an error here
            console.error("Error checking for existing next round:", existingRoundError.message);
            // Potentially return error, or try to proceed if minor
        }
            
        if (existingNextRoundData) {
            console.log(`Round ${nextRoundCheck} (ID: ${existingNextRoundData.id}) already exists, another process has already started it.`);
            // Ensure games.current_round is updated if it was lagging
            if (gameData.current_round < nextRoundCheck) {
                console.log(`Games table current_round (${gameData.current_round}) is lagging behind actual round (${nextRoundCheck}). Updating.`);
                const { error: updateError } = await supabase.from("games").update({ current_round: nextRoundCheck }).eq("id", gameId);
                if (updateError) {
                    console.error("Error updating games.current_round:", updateError.message);
                    // Log error but still return existing round data as it's the primary goal here
                }
            }
            return { 
                success: true, 
                message: "Round already created or handled by another process",
                data: {
                    gameId: gameId, // Added gameId
                    newPrompter: existingNextRoundData.prompter_id,
                    round: existingNextRoundData.round,
                    roundID: existingNextRoundData.id // Ensured roundID is present
                }
            };
        }
        
        // Cleanup duplicate entries for the *current* round number (currentRoundNumberFromGamesTable), before proceeding.
        // This ensures we get the correct prompter_id for the current round N.
        const currentRoundNumberFromGamesTable = gameData.current_round;
        const { data: currentRoundEntries, error: currentRoundsError } = await supabase
            .from("round")
            .select("id, created_at, prompter_id") // Also select prompter_id
            .eq("game_id", gameId)
            .eq("round", currentRoundNumberFromGamesTable);
            
        if (currentRoundsError) {
            console.log(`Error checking for duplicate current rounds (${currentRoundNumberFromGamesTable}):`, currentRoundsError.message);
            // Potentially critical, but attempt to continue if possible.
        } else if (currentRoundEntries && currentRoundEntries.length > 1) {
            console.log(`Found ${currentRoundEntries.length} entries for current round ${currentRoundNumberFromGamesTable}. Aligning prompter_ids and keeping records...`);
            // Sort by creation time, most recent first
            currentRoundEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            const masterRoundEntry = currentRoundEntries[0];
            const masterPrompterId = masterRoundEntry.prompter_id;
                
            for (let i = 1; i < currentRoundEntries.length; i++) { 
                const olderRoundEntry = currentRoundEntries[i];
                const roundToProcessId = olderRoundEntry.id;

                console.log(`Processing older duplicate round entry ID ${roundToProcessId} for round ${currentRoundNumberFromGamesTable}`);
                
                // First delete any submissions associated with this older duplicate round,
                // as they pertain to its state before prompter_id alignment.
                console.log(`Deleting submissions for older duplicate round ID ${roundToProcessId}`);
                const { error: subDeleteError } = await supabase
                    .from("submissions")
                    .delete()
                    .eq("round_id", roundToProcessId);
                if (subDeleteError) {
                    console.log(`Warning: Error deleting submissions for older duplicate round ${roundToProcessId}:`, subDeleteError.message);
                }

                // Then, instead of deleting the round record, update its prompter_id
                // to match the master entry if it's different.
                if (olderRoundEntry.prompter_id !== masterPrompterId) {
                    console.log(`Updating prompter_id for round ${roundToProcessId} from ${olderRoundEntry.prompter_id} to ${masterPrompterId}`);
                    const { error: roundUpdateError } = await supabase
                        .from("round")
                        .update({ prompter_id: masterPrompterId })
                        .eq("id", roundToProcessId);
                    if (roundUpdateError) {
                        console.log(`Warning: Error updating prompter_id for round ${roundToProcessId}:`, roundUpdateError.message);
                    } else {
                        console.log(`Successfully updated prompter_id for round ${roundToProcessId}.`);
                    }
                } else {
                    console.log(`Prompter_id for round ${roundToProcessId} already matches master. Round record kept, submissions (if any) deleted.`);
                }
            }
            console.log(`Processed ${currentRoundEntries.length - 1} older duplicate round entries for round ${currentRoundNumberFromGamesTable}. Submissions cleared, prompter_ids aligned, round records kept.`);
        }

        // Get the prompter_id from the definitive current round N.
        const { data: roundDataArray, error: roundError } = await supabase
            .from("round")
            .select("prompter_id")
            .eq("game_id", gameId)
            .eq("round", currentRoundNumberFromGamesTable) // Use the round number from 'games' table
            .order('created_at', { ascending: false }) // Get the latest (should be only one after cleanup)
            .limit(1);

        if (roundError) {
            console.log(`Error fetching current round (${currentRoundNumberFromGamesTable}) data:`, roundError.message);
            return { success: false, message: roundError.message };
        }
        
        if (!roundDataArray || roundDataArray.length === 0) {
            console.log(`No round data found for game ${gameId} and round ${currentRoundNumberFromGamesTable}. This might happen if the game is just starting or an error occurred.`);
            // This could be a valid state if round 0 was conceptual and round 1 is the first DB entry.
            // However, if currentRoundNumberFromGamesTable > 0, this is an issue.
            if (currentRoundNumberFromGamesTable > 0) {
                 return { success: false, message: `No round data found for current round ${currentRoundNumberFromGamesTable}`, gameId: gameId };
            }
            // If currentRoundNumberFromGamesTable is 0 (or initial state), this might be okay if first round is target.
            // But `startGame` should handle first round creation. This function is for *next* round.
            // So, if currentRoundNumberFromGamesTable is 0, it implies round 1 is the target.
            // The prompter_id would need to be the first prompter. This logic is complex here.
            // For now, assume if currentRoundNumberFromGamesTable > 0, an entry must exist.
            // If currentRoundNumberFromGamesTable is 0, this path shouldn't be hit if startGame works.
             return { success: false, message: "No round data found for current round to determine prompter.", gameId: gameId };
        }
        
        const currentRound = roundDataArray[0];

        console.log("Current round data:", currentRound);
        console.log("Current prompter ID:", currentRound.prompter_id);
        
        // Thoroughly check for and clean up duplicates or orphaned submissions for the next round
        const nextRoundNumber = gameData.current_round + 1;
        
        // Delete any existing submissions for the *actual previous round*
        if (nextRoundNumber > 1) {
            const previousActualRoundNumber = nextRoundNumber - 1;
            const { data: prevRoundEntries, error: prevRoundEntriesError } = await supabase
                .from("round")
                .select("id")
                .eq("game_id", gameId) // Corrected from game_id to gameId
                .eq("round", previousActualRoundNumber)
                .order('created_at', { ascending: false }); // Get all, though should be one

            if (!prevRoundEntriesError && prevRoundEntries && prevRoundEntries.length > 0) {
                for (const prevRoundEntry of prevRoundEntries) { // Loop in case cleanup in startNextRound missed one
                    console.log(`Cleaning up submissions for previous round ${previousActualRoundNumber} (ID: ${prevRoundEntry.id})...`);
                    const { error: deleteSubError } = await supabase
                        .from("submissions")
                        .delete()
                        .eq("round_id", prevRoundEntry.id);
                    if (deleteSubError) console.log(`Error deleting submissions for old round ${prevRoundEntry.id}:`, deleteSubError.message);
                    else console.log(`Submissions for old round ${prevRoundEntry.id} cleaned up.`);
                }
            }
        }

        // Start the next round by passing the current prompter's ID and the target round number
        // handleRoundTable will find the next prompter in the turn order based on turn_order
        console.log(`Starting next round. Current prompter ID: ${currentRound.prompter_id}, target round number: ${nextRoundNumber}`);
        const result = await handleRoundTable(gameId, currentRound.prompter_id, nextRoundNumber);
        
        if (!result.success) {
            return { success: false, message: result.message, gameId: gameId };
        }
        
        console.log(`Next round setup complete. Game ID: ${gameId}, New prompter ID: ${result.data}, Round: ${result.round}, Round ID: ${result.roundID}`);
        
        return { 
            success: true, 
            data: {
                gameId: gameId,                 // Added gameId
                newPrompter: result.data, // This is newPrompterIdForTargetRound from handleRoundTable
                round: result.round,      // This is targetNewRoundNumber
                roundID: result.roundID   // Added roundID from handleRoundTable result
            }
        };
    } catch (error) {
        console.log("Error starting next round:", error.message);
        return { success: false, message: error.message };
    }
};

export const endGame = async (gameId) => {
    /*
     * Ends the game and updates the game status to 'completed'
     * 
     * @param {string} gameId - ID of the game to end
     * @returns {Object} Result of the execution, including success and error if any
     */
    try {
        console.log("Ending game:", gameId);
        
        // Update game status to completed
        const { error: updateError } = await supabase
            .from("games")
            .update({ status: "completed" })
            .eq("id", gameId);
            
        if (updateError) {
            console.log("Error updating game status to completed:", updateError.message);
            return { success: false, message: updateError.message };
        }
        
        // Get final player scores
        const { data: playerData, error: playerError } = await supabase
            .from("playergame")
            .select("id, player_id, score, users (username, image_url)")
            .eq("game_id", gameId)
            .order("score", { ascending: false });
            
        if (playerError) {
            console.log("Error fetching final player scores:", playerError.message);
            return { success: false, message: playerError.message };
        }
        
        // Determine winner(s) - players with the highest score
        const winners = playerData.length > 0 ? 
            playerData.filter(player => player.score === playerData[0].score) : [];
        
        console.log("Game ended successfully. Winners:", winners.map(w => w.users?.username));
        
        return { 
            success: true, 
            data: {
                winners: winners,
                allPlayers: playerData
            }
        };
    } catch (error) {
        console.log("Error ending game:", error.message);
        return { success: false, message: error.message };
    }
};