import { SafeAreaView, StyleSheet, Text, View, Platform, Modal, Image } from 'react-native'
import { useEffect, useState, useRef } from 'react'
import Button from '../../components/Button';
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Profile from '../../components/Profile';
import { theme } from '../../constants/theme';
import { getUserPayloadFromStorage } from '../../service/userService';
import Gallery from '../../components/GameComponent/Gallery';
import { supabase } from '../../lib/supabase';
import { getRoundData } from '../../service/gameService';
import Prompter from '../../components/GameComponent/Prompter';
import ImageSubmission from '../../components/GameComponent/ImageSubmission';
import { getSubmissionData, getGameDataOptimized } from '../../service/gameService'
import { getSupabaseUrl } from '../../service/imageService';
import Winner from '../../components/GameComponent/Winner';
import * as ImagePicker from 'expo-image-picker';
import LoadingPhotobomb from '../../components/GameComponent/PhotobombLoading';
import * as ImageManipulator from 'expo-image-manipulator';


const Main = () => {
    const router = useRouter()
    const [userPayload, setUserPayload] = useState(null); 
    const [currentStage, setCurrentStage] = useState('Prompt'); 
    const [showPrompterPayload, setShowPrompterPayload] = useState(null);

    const [isPrompter, setIsPrompter] = useState(null);
    const [isPrompterSubmit, setIsPrompterSubmit] = useState(false);

    const [gameID, setGameId] = useState(null);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [imagesSelected, setImagesSelected] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);

    const [winnerData, setWinnerData] = useState(null);
    
    // Cache for frequently accessed data to reduce database queries
    const [currentRoundData, setCurrentRoundData] = useState(null);
    const [allPlayersData, setAllPlayersData] = useState(null);
    const [submissionsData, setSubmissionsData] = useState(null);
    

    const handlePromptSelect = (promptData) => {
        setSelectedPrompt(promptData);
        setIsPrompterSubmit(true);
     }
    
    const renderComponent = () => {
        console.log('this is the game stage: ', currentStage);

        if (currentStage === 'Prompt') {

            if (isPrompter) {
                return <Prompter onPromptSelect={handlePromptSelect} />;
            } else {
                return <LoadingPhotobomb />;
            }
        } else if (currentStage === 'ImageGallery') {
            return <ImageSubmission currentPrompt={selectedPrompt.text} gameId={gameID}/>;
        } else if (currentStage === 'GalleryTime') {
            return <Gallery gameId={gameID} currentPrompt={selectedPrompt?.text} prompter={isPrompter}/>;
        } else if (currentStage === 'Winner') {
            return <Winner 
                winnerData={winnerData} 
                currentPrompt={selectedPrompt?.text}
                gameId={gameID}
            />;
            
        }
    };

    const renderButtons = () => {
        if (currentStage === 'Prompt') {
            if (isPrompter) {
                return isPrompterSubmit ? (
                    <Button
                        title='Submit'
                        colors={theme.buttonGradient.success} 
                        onPress={PrompterButtonSubmit}
                    />
                ) : (
                    <Button 
                        title='Pick photo' 
                        colors={theme.buttonGradient.secondary} 
                        onPress={() => setCurrentStage('Prompt')}
                    />
                );
            } else {
                return <Button title='Wait for Prompter' colors={theme.buttonGradient.secondary} onPress={() => console.log('wait for the Prompter')}
            />
            }
        } else if (currentStage === 'ImageGallery') {
            if (isPrompter) {
                return (
                    <Button
                        title='Wait for the players...'
                        colors={theme.buttonGradient.primary}
                        onPress={() => console.log('Submit')}
                    />
                );
            } else {
                return imagesSelected ? (
                    <Button
                        title='Selected Image'
                        colors={theme.buttonGradient.secondary}
                    />
                ) : (
                    
                    <Button
                        title='Upload Image'
                        colors={theme.buttonGradient.primary}
                        onPress={handleSelectImage}
                    />
                );
            }
        } else if (currentStage === 'GalleryTime') {
            return;

        } else if (currentStage === 'Winner') {
                
            if (winnerData?.status === 'completed') {

                
                return (
                    <Button
                        title='Back to Home'
                        colors={theme.buttonGradient.primary}
                        onPress={() => router.push('/Main')}
                    />
                );
            } else {
                return ;
            }
        };
    };

    const renderHeaderText = () => {
        if (currentStage === 'Prompt') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(showPrompterPayload?.data?.users?.image_url)}/>
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>picking the prompt...</Text>
                </View>
            )
        } else if (currentStage === 'ImageGallery') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(showPrompterPayload?.data?.users?.image_url)}/>
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>picked the prompt...</Text>
                    
                </View>
            )
        } else if (currentStage === 'GalleryTime') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(showPrompterPayload?.data?.users?.image_url)}/>
                    
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>picking the winner...</Text>
                    
                </View>
            )

        } else if (currentStage === 'Winner') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(showPrompterPayload?.data?.users?.image_url)}/>
                    
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>got the best photo for</Text>
                    
                </View>
            )
        };
    };


    const fetchUserData = async () => {
        try {
            const Userpayload = await getUserPayloadFromStorage();
            if (!Userpayload) {
                console.log('No user payload found in storage');
                return;
            }
            
            setUserPayload(Userpayload);

            // Combine multiple selects into a single query with specific fields
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id, username, image_url,
                    playergame(id, game_id, is_creator, player_id)
                `)
                .eq('id', Userpayload.id)
                .single();
    
            if (error) {
                console.log('Something went wrong with fetching user data MainGame.jsx', error.message);
                return;
            }
                
            if (data?.playergame && data.playergame.length > 0) {
                // Sort entries by created_at descending to get the latest
                const sortedGames = [...data.playergame].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const latestGameId = sortedGames[0].game_id;
                console.log('Setting game ID to latest:', latestGameId);
                setGameId(latestGameId);
            } else {
                console.log('No player game data found for this user');
            }
        } catch(error) {
            console.log('Something went wrong with fetching user data MainGame.jsx', error.message);
        }
    };    
    
    const mainRoundUpdateHandler = async (payload) => {
        try {
            console.log("Round update received:", payload);

            // Handle updates when a prompter selects a prompt
            if (payload?.eventType === 'UPDATE' && payload?.new?.prompt_id) {
                const {data: promptDataTable, error: promptDataError} = await supabase
                    .from('prompts')
                    .select(`*`)
                    .eq('id', payload?.new?.prompt_id)
                    .single();

                if (promptDataError) {
                    console.log('Error in the mainGameUpdateHandler: ', promptDataError.message);
                    return {success: false, message: promptDataError.message};
                }

                // Get the round data to ensure we have the prompter info
                const {data: roundData, error: roundError} = await getRoundData(gameID);
                if (roundError) {
                    console.error('Error fetching round data:', roundError.message);
                    return {success: false, message: roundError.message};
                }
                
                
                // Get prompter info to ensure UI renders correctly for all users
                if (roundData?.data?.prompter_id) {
                    const prompterPayload = await viewPlayerGameTable(roundData.data.prompter_id);
                    setShowPrompterPayload(prompterPayload);
                }
                
                // Check if current user is the prompter
                const rolePayload = await checkUserRole();
                setIsPrompter(rolePayload?.data?.is_prompter);

                // Only create submissions for non-prompters, and only if the current user is the prompter
                // This ensures submission creation only happens once, from the prompter's device
                if (rolePayload?.data?.is_prompter) {
                    console.log("Current user is the prompter - will create submissions for other players");
                    // Create submissions for non-prompter players
                    await createSubmissionsForPlayers();
                } else {
                    console.log("Current user is not the prompter - will not create submissions");
                }
                
                // Update state for all players (prompter and non-prompters)
                setSelectedPrompt(promptDataTable);
                setCurrentStage('ImageGallery');
                
                console.log("All players should now be in ImageGallery stage");
            } 
            // Handle new round creation after winner timer completes
            else if (payload?.eventType === 'INSERT') {
                console.log("New round detected:", payload);
                
                // Get the new round data
                const {data: roundData, error: roundError} = await getRoundData(gameID);
                if (roundError) {
                    console.error('Error fetching new round data:', roundError.message);
                    return;
                }
                
                // Reset all the states for a new round
                setSelectedPrompt(null);
                setIsPrompterSubmit(false);
                setImagesSelected(false);
                setWinnerData(null);
                
                // Get new prompter info
                if (roundData?.data?.prompter_id) {
                    const retrievePrompterPayload = await viewPlayerGameTable(roundData.data.prompter_id);
                    setShowPrompterPayload(retrievePrompterPayload);
                } else {
                    console.log('No valid prompter_id found in new round data');
                    // Set a default empty payload to avoid UI errors
                    setShowPrompterPayload({success: false, data: { users: {}, score: 0 }});
                }
                
                // Check if the current user is the new prompter
                const getRolePlayerBool = await checkUserRole();
                setIsPrompter(getRolePlayerBool?.data?.is_prompter); // Use is_prompter instead of is_creator
                
                // Set stage back to Prompt for the new round
                setCurrentStage('Prompt');
                
                console.log("Transitioned to new round:", roundData?.data?.round);
            }
        } catch(error) {
            console.error('Error in mainRoundUpdateHandler:', error.message);
        }
    };

    const mainSubmissionUpdateHandler = async (payload) => {
        try {
            console.log('Submission update received:', payload);

            if (payload?.eventType === 'UPDATE') {
                // If the payload contains a photo_uri that's not null, we can optimize
                // by checking if this specific update means all submissions are complete
                const updatedSubmission = payload.new;
                
                // If the updated submission has a photo, check if we need to update all submissions
                if (updatedSubmission && updatedSubmission.photo_uri) {
                    // If we have cached submissions data, use it instead of fetching again
                    if (submissionsData) {
                        // Update our cached copy with the new data
                        const updatedCache = submissionsData.map(sub => 
                            sub.id === updatedSubmission.id ? {...sub, photo_uri: updatedSubmission.photo_uri} : sub
                        );
                        setSubmissionsData(updatedCache);
                        // Debug: print the updated cache and allSubmitted result
                        console.log('Updated submissions cache:', updatedCache);
                        const allSubmitted = updatedCache.every(submission => submission.photo_uri !== null);
                        console.log('allSubmitted:', allSubmitted, 'cache length:', updatedCache.length);
                        if (allSubmitted) {
                            console.log('All players have submitted their photos. Moving to GalleryTime stage.');
                            setCurrentStage('GalleryTime');
                            return;
                        } else {
                            const pendingCount = updatedCache.filter(sub => !sub.photo_uri).length;
                            console.log(`Waiting for ${pendingCount} more submissions.`);
                            return;
                        }
                    }
                }
                
                // Fall back to fetching all submissions if we can't optimize with the cache
                const submissionPayload = await getSubmissionData(gameID);
    
                if (!submissionPayload.success) {
                    console.log('Error checking submissions:', submissionPayload.message);
                    return;
                }
                
                // Cache the submissions for future use
                setSubmissionsData(submissionPayload.data);
                
                console.log('Submission data count:', submissionPayload.data.length);
                
                // Check each submission individually and log its status
                submissionPayload.data.forEach(sub => {
                    console.log(`Submission ID: ${sub.id}, Player ID: ${sub.player_id}, Photo: ${sub.photo_uri ? 'Has photo' : 'No photo'}`);
                });
    
                const allSubmitted = submissionPayload.data.every(submission => submission.photo_uri !== null);
    
                if (allSubmitted) {
                    console.log('All players have submitted their photos. Moving to GalleryTime stage.');
                    setCurrentStage('GalleryTime');
                } else {
                    const pendingCount = submissionPayload.data.filter(sub => !sub.photo_uri).length;
                    console.log(`Waiting for ${pendingCount} more submissions.`);
                }
            }
        } catch (error) {
            console.error('Error in mainSubmissionUpdateHandler:', error.message);
        }
    };

    const mainPlayerGameUpdateHandler = async (payload) => {
        try {

            console.log('Submission update received:', payload);
            if (payload?.eventType === 'UPDATE') {
                
                // First get the current round ID to filter submissions
                const {data: roundDataArray, error: roundError} = await supabase
                    .from('round')
                    .select('id, round')
                    .eq('game_id', gameID)
                    .order('round', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (roundError) {
                    console.error('Error fetching current round:', roundError.message);
                    return {success: false, message: roundError.message};
                }
                
                if (!roundDataArray || roundDataArray.length === 0) {
                    console.error('No round data found for this game');
                    return {success: false, message: 'No round data found'};
                }
                
                const currentRoundId = roundDataArray[0].id;
                console.log('Current round data in mainPlayerGameUpdateHandler:', roundDataArray[0]);
                
                // Get the player's data with submissions filtered by current round
                const { data: data, error } = await supabase
                    .from('playergame')
                    .select(`*,
                             submissions!inner(id, photo_uri, round_id),
                             users (username, image_url)`)
                    .eq('id', payload.new.id)
                    .filter('submissions.round_id', 'eq', currentRoundId)
                    .filter('submissions.photo_uri', 'not.is', null)
                    .single();

                if (error) {
                    console.log('Error checking submissions:', error.message);
                    return {success: false, message: error.message};
                }

                console.log('Submission data this is the winner data:', data);
                
                // Make sure we have valid submission data
                if (!data.submissions || data.submissions.length === 0) {
                    console.error('No valid submission found for the winner');
                    return {success: false, message: 'No valid submission found'};
                }
                
                setWinnerData({
                    username: data.users.username,
                    image_url: data.users.image_url,
                    photo_uri: data.submissions[0].photo_uri,
                });

                setCurrentStage('Winner');
            }
        } catch(error) {
            console.error('Error in mainSubmissionUpdateHandler:', error.message);
        }
    }

    const checkUserRole = async () => {
        /**
         * in this function will look for the locat user role of the game 
         * given the game id and the player id from the round table and check if thier the prompter
         * if the user is the prompter then the state will be true and they will be a new ui and new 
         * instruction
         */
        try {
            // Make sure we have both the user ID and game ID before proceeding
            if (!userPayload?.id || !gameID) {
                console.log('Missing required data for checkUserRole. UserID:', userPayload?.id, 'GameID:', gameID);
                return {success: false, message: "Missing user ID or game ID", data: { is_prompter: false }};
            }

            console.log('Checking role for user ID:', userPayload.id, 'in game ID:', gameID);
            
            // Use cached player data if available
            let fetchPlayerGameData;
            if (allPlayersData) {
                const cachedPlayerData = allPlayersData.find(player => 
                    player.player_id === userPayload.id && player.game_id === gameID
                );
                
                if (cachedPlayerData) {
                    fetchPlayerGameData = cachedPlayerData;
                    console.log('Using cached player data:', fetchPlayerGameData);
                }
            }
            
            // If no cached data, query the database
            if (!fetchPlayerGameData) {
                // Get all player game entries for this player in this game
                const {data: playerGameData, error: playerGameError} = await supabase
                    .from('playergame')
                    .select(`*,
                             users (username)`)
                    .eq('player_id', userPayload.id)
                    .eq('game_id', gameID);

                if (playerGameError) {
                    console.log('Error in the checkUserRole:', playerGameError.message);
                    return {success: false, message: playerGameError.message, data: { is_prompter: false }};
                }
                
                if (!playerGameData || playerGameData.length === 0) {
                    console.log('No player game entry found for this user in this game');
                    return {success: false, message: "Player not found in this game", data: { is_prompter: false }};
                }
                
                // Take the first record (there should only be one per player per game)
                fetchPlayerGameData = playerGameData[0];
                console.log('Found player game data:', fetchPlayerGameData);
            }

            // Use cached round data if available
            let roundData;
            if (currentRoundData) {
                roundData = currentRoundData;
                console.log('Using cached round data');
            } else {
                // Get the current round data to check if this player is the prompter
                console.log('⭐️ BEFORE ROUND QUERY - gameID:', gameID);
                const {data: roundDataArray, error: roundError} = await supabase
                    .from('round')
                    .select('prompter_id, round, id')
                    .eq('game_id', gameID)
                    .order('round', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1);
                    
                console.log('⭐️ AFTER ROUND QUERY - Current round data in checkUserRole:', roundDataArray);
                    
                if (roundError) {
                    console.log('Error fetching round data in checkUserRole:', roundError.message);
                    return {success: false, message: roundError.message, data: { is_prompter: false }};
                }
                
                if (!roundDataArray || roundDataArray.length === 0) {
                    console.log('No round data found for this game');
                    return {success: false, message: 'No round data found', data: { is_prompter: false }};
                }
                
                roundData = roundDataArray[0];
                // Cache the round data for future use
                setCurrentRoundData(roundData);

            }
            
            // Add a flag to indicate if this player is the prompter in the current round
            // In the round table, prompter_id refers to the playergame.id, not the player_id
            // So we need to compare fetchPlayerGameData.id with roundData.prompter_id
            fetchPlayerGameData.is_prompter = (fetchPlayerGameData.id === roundData.prompter_id);
            console.log(`Player ${fetchPlayerGameData.id} is prompter: ${fetchPlayerGameData.is_prompter}`);
            
            // Debugging the prompter detection
            console.log('Comparing ids to determine prompter:');
            console.log('Player Game ID:', fetchPlayerGameData.id, 'Type:', typeof fetchPlayerGameData.id);
            console.log('Round Prompter ID:', roundData.prompter_id, 'Type:', typeof roundData.prompter_id);
            
            return {success: true, data: fetchPlayerGameData};

        } catch(error) {
            console.log('Error in the checkUserRole:', error.message);
            return {success: false, message: error.message, data: { is_prompter: false }};
        }
    }

    const viewPlayerGameTable = async (playerGameId) => {
        try {
            // Check if playerGameId is undefined or null
            if (!playerGameId || playerGameId === "undefined") {
                console.log('Error on View PlayerGameTable: playerGameId is undefined or null');
                return {success: false, message: 'invalid input syntax for type uuid: undefined', data: { users: {}, score: 0 }};
            }
            
            const { data: dataPlayerGame, error: errorPLayerGame} = await supabase
                .from('playergame')
                .select(`*,
                         users (username, image_url)`)
                .eq('id', playerGameId)
                .single();

            if (errorPLayerGame) {
                console.log('Error on View PlayerGameTable: ', errorPLayerGame.message);
                return {success: false, message: errorPLayerGame.message, data: { users: {}, score: 0 }};
            }

            return {success: true, data: dataPlayerGame};
        } catch(error) {
            console.log('Error on View PlayerGameTable: ', error.message);
            return {success: false, message: error.message, data: { users: {}, score: 0 }};
        }
    };

    const PrompterButtonSubmit = async () => {
        try {
            console.log('This is the selected prompt: ', selectedPrompt);
            console.log('This is the game id: ', gameID);

            const {data: PromptSubmitData, error: PromptSumbitDataError} = await supabase
                .from('round')
                .update({
                    prompt_id: selectedPrompt.id,
                })
                .eq('game_id', gameID)
                .select();

            if (PromptSumbitDataError) {
                console.log('Error in PrompterButtonSubmit: ', PromptSumbitDataError.message);
                return {success: false, message: PromptSumbitDataError.message};
            }
            
            // Note: We no longer need to modify state here since the real-time subscription
            // will update all clients (including the prompter) when the round update is detected
            console.log('Prompt submitted successfully. Waiting for real-time update.');
            
        } catch(error) {
            console.error('Error in PrompterButtonSubmit: ', error.message);
        }
    };

    const handleSelectImage = async () => {
        try {
            // First check if user is the prompter - prompters should not submit images
            const checkRolePayload = await checkUserRole();
            if (checkRolePayload?.data?.is_prompter) {
                Alert.alert('You are the prompter', 'As the prompter for this round, you choose the winner instead of submitting a photo.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType,
                quality: 0.6,
            });

            if (!result.cancelled && result.assets && result.assets[0]?.uri) {
            setSelectedImageUri(result.assets[0].uri);
            setIsModalVisible(true);
            } else {
                
                setIsModalVisible(false);
                setSelectedImageUri(null);
            }

        } catch (error) {
            Alert.alert('Error', 'Failed to select an image.');
        };

    };

    const uploadImageToSupabase = async (uri) => {
        if (!uri) return {success: false, message: "no uri"};
      
        try {
          const fileName = uri.split('/').pop(); 
          const fileType = fileName.split('.').pop().toLowerCase(); 
          const mimeType = fileType === 'jpg' ? 'image/jpeg' : `image/${fileType}`;

          // Downscale and compress the image before upload
          const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 800 } }],  // adjust width as needed
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          const fileBuffer = Uint8Array.from(atob(manipulated.base64), c => c.charCodeAt(0));

          const { data, error } = await supabase.storage
            .from('uploads')
            .upload(`gamesubmissions/${fileName}`, fileBuffer, {
              contentType: mimeType,
            });
      
          if (error) {
            console.log('Supabase storage upload error:', error.message);
            return {success: false, message: error.message};
          }
      
          return {success: true, message: data}
        } catch (error) {
          console.log('Image upload failed:', error.message);
          return {success: false, message: error.message};
        }
      };


      const createSubmissionsForPlayers = async () => {
        try {
            // First check if submissions already exist for this round
            const {data: roundDataArray, error: roundError} = await supabase
                .from('round')
                .select(`*, 
                         prompts (id, text)`)
                .eq('game_id', gameID)
                .order('round', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(1);

            if (roundError) {  
                console.log('Error in createSubmissionsForPlayers: ', roundError.message);
                return {success: false, message: roundError.message};
            }
            
            if (!roundDataArray || roundDataArray.length === 0) {
                console.log('No round data found for this game');
                return {success: false, message: 'No round data found'};
            }
            
            const roundData = roundDataArray[0];
            console.log('Round data in createSubmissionsForPlayers:', roundData);

            // Check for existing submissions for this round
            const {data: existingSubmissions, error: submissionsError} = await supabase
                .from('submissions')
                .select('player_id')
                .eq('round_id', roundData.id);
                
            if (submissionsError) {
                console.error('Error checking existing submissions: ', submissionsError.message);
                return {success: false, message: submissionsError.message};
            }
            
            // Get the list of player IDs who already have submissions
            const existingPlayerIds = existingSubmissions ? existingSubmissions.map(sub => sub.player_id) : [];
            console.log('Players with existing submissions:', existingPlayerIds);

            // Get all players in the game
            const {data: players, error: playersError} = await supabase
                .from('playergame')
                .select(`*,
                         users (username, image_url)`)
                .eq('game_id', gameID);

            if (playersError) {
                console.error('Error in createSubmissionsForPlayers: ', playersError.message);
                return {success: false, message: playersError.message};
            }

            // Get the current prompter ID to exclude them from submissions
            const prompterId = roundData.prompter_id;
            console.log("Current prompter ID (excluded from submissions):", prompterId);

            // Find players who don't have submissions yet and are not the prompter
            const submissionPromises = players
                // Filter out the prompter and players who already have submissions
                .filter(player => {
                    // Double check that this player is not the prompter
                    const isPrompter = player.id === prompterId;
                    const hasSubmission = existingPlayerIds.includes(player.id);
                    
                    console.log(`Player ${player.id}: isPrompter=${isPrompter}, hasSubmission=${hasSubmission}`);
                    
                    // Only include non-prompters who don't have submissions yet
                    return !isPrompter && !hasSubmission;
                })
                .map(player => {
                    console.log(`Creating submission for player ${player.id}`);
                    return supabase
                        .from('submissions')
                        .insert({
                            round_id: roundData.id,
                            player_id: player.id,
                            photo_uri: null,
                            game_id: gameID,
                        });
                });

            if (submissionPromises.length > 0) {
                await Promise.all(submissionPromises);
                console.log(`Created ${submissionPromises.length} new submissions for players`);
            } else {
                console.log('No new submissions needed - all players already have submissions');
            }

            return {success: true, message: 'Created submissions for all players'};

        } catch(error) {
            console.log('Error in createSubmissionsForPlayers: ', error.message);
            return {success: false, message: error.message};
        }
      };

    const cancelImageSelection = () => {
        setIsModalVisible(false);
        setSelectedImageUri(null);
    };

    const confirmImageSelection = async () => {
        try {
            // Use cached round data if available to avoid redundant database query
            let roundData;
            if (currentRoundData) {
                roundData = currentRoundData;
                console.log('Using cached round data for image submission');
            } else {
                // First, check if this user is the prompter - prompters should not submit photos
                const {data: roundDataArray, error: roundError} = await supabase
                    .from('round')
                    .select(`id, round, prompter_id`)
                    .eq('game_id', gameID)
                    .order('round', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (roundError) {
                    console.log('Error fetching round data: ', roundError.message);
                    return {success: false, message: roundError.message};
                }
                
                if (!roundDataArray || roundDataArray.length === 0) {
                    console.log('No round data found for this game');
                    return {success: false, message: 'No round data found'};
                }
                
                roundData = roundDataArray[0];
                // Cache the round data for future use
                setCurrentRoundData(roundData);
            }
            
            console.log('Current active round data in confirmImageSelection:', roundData);

            const { data: playergameData, error: playergameError} = await supabase
                .from('playergame')
                .select(`*`)
                .eq('game_id', gameID)
                .eq('player_id', userPayload.id)
                .single();

            if (playergameError) {
                console.log('Error in confirmImageSelection: ', playergameError.message);
                return {success: false, message: playergameError.message};
            }

            const playerGameId = playergameData.id;
            
            // Check if this player is the prompter - if so, don't submit
            if (playerGameId === roundData.prompter_id) {
                console.log('This player is the prompter and should not submit photos');
                Alert.alert('You are the prompter', 'Prompters cannot submit photos in this round.');
                setIsModalVisible(false);
                return {success: false, message: "Prompters don't submit photos"};
            }

            // Optimistically update UI before waiting for network operations
            setIsModalVisible(false);
            setImagesSelected(true);
            
            // Generate filename for the image
            const fileName = selectedImageUri.split('/').pop();
            const photoUri = `gamesubmissions/${fileName}`;
            
            // Start upload in background
            const uploadResult = uploadImageToSupabase(selectedImageUri);
            
            // In parallel, find the submission record
            const { data: submissionData, error: submissionError } = await supabase
                .from('submissions')
                .select('*')
                .eq('game_id', gameID)
                .eq('round_id', roundData.id)
                .eq('player_id', playerGameId);
            
            if (submissionError) {
                console.log('Error finding submission: ', submissionError.message);
                setImagesSelected(false); // Revert optimistic update
                return {success: false, message: submissionError.message};
            }
            
            console.log('Found submission(s):', submissionData);
            
            // Wait for upload to complete
            const uploadResponse = await uploadResult;
            if (!uploadResponse.success) {
                console.log('Upload failed:', uploadResponse.message);
                setImagesSelected(false); // Revert optimistic update
                Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
                return uploadResponse;
            }
            
            // Now update or create the submission record
            try {
                // If no submission exists, create one
                if (!submissionData || submissionData.length === 0) {
                    console.log('No submission found, creating a new one...');
                    const { data: newSubmission, error: insertError } = await supabase
                        .from('submissions')
                        .insert({
                            round_id: roundData.id,
                            player_id: playerGameId,
                            photo_uri: photoUri,
                            game_id: gameID,
                        })
                        .select();
                        
                    if (insertError) {
                        console.log('Error creating new submission: ', insertError.message);
                        setImagesSelected(false); // Revert optimistic update
                        return {success: false, message: insertError.message};
                    }
                    
                    console.log('Created new submission successfully:', newSubmission);
                    
                    // Update our cached submissions data
                    if (submissionsData) {
                        setSubmissionsData([...submissionsData, newSubmission[0]]);
                    }
                } else {
                    // Update existing submission
                    const {data, error} = await supabase
                        .from('submissions')
                        .update({
                            photo_uri: photoUri,
                        })
                        .eq('id', submissionData[0].id)
                        .select();
                        
                    if (error) {
                        console.log('Error updating submission: ', error.message);
                        setImagesSelected(false); // Revert optimistic update
                        return {success: false, message: error.message};
                    }
                    
                    console.log('Updated submission successfully:', data);
                    
                    // Update our cached submissions data
                    if (submissionsData) {
                        const updatedSubmissions = submissionsData.map(sub => 
                            sub.id === submissionData[0].id ? {...sub, photo_uri: photoUri} : sub
                        );
                        setSubmissionsData(updatedSubmissions);
                    }
                }

                return {success: true};
            } catch (error) {
                console.log('Error in confirmImageSelection: ', error.message);
                setImagesSelected(false); // Revert optimistic update
                Alert.alert('Error', 'Failed to save your submission. Please try again.');
                return {success: false, message: error.message};
            }
        } catch (error) {
            console.log('Error in confirmImageSelection: ', error.message);
            setIsModalVisible(false);
            setImagesSelected(false); // Revert optimistic update
            return {success: false, message: error.message};
        }
    };

    useEffect(() => {
        const initiallizeGameData = async () => {
            try {
                await fetchUserData();

                // Wait for gameID to be set, up to 10 times (2 seconds max)
                let waitCount = 0;
                while (!gameID && waitCount < 10) {
                    console.log('Waiting for gameID to be set...');
                    await new Promise(res => setTimeout(res, 200)); // Wait for 200ms
                    waitCount++;
                }

                if (!gameID) {
                    console.log('GameID still not set after waiting. Exiting initialization.');
                    return;
                }

                console.log('Initializing game data for game ID:', gameID);

                // Use the new optimized function to get all game data in a single query
                const gameDataResult = await getGameDataOptimized(gameID);
                
                if (gameDataResult?.success && gameDataResult?.data) {
                    const { game, currentRound, submissions, players } = gameDataResult.data;
                    
                    // Process round data
                    if (currentRound?.prompter_id) {
                        // Cache the round data
                        setCurrentRoundData(currentRound);
                        
                        // Get prompter details
                        const prompterPayload = await viewPlayerGameTable(currentRound.prompter_id);
                        setShowPrompterPayload(prompterPayload);

                        // Check if current user is the prompter
                        const rolePayload = await checkUserRole();
                        setIsPrompter(rolePayload?.data?.is_prompter);
                    } else {
                        console.log('Unable to retrieve valid round data or prompter_id is missing');
                        setShowPrompterPayload({success: false, data: { users: {}, score: 0 }});
                    }

                    // Cache players data
                    setAllPlayersData(players);

                    // Cache submissions data
                    setSubmissionsData(submissions);
                    
                    console.log('Optimized game data loaded successfully');
                } else {
                    console.log('Failed to load optimized game data, falling back to individual queries');
                    
                    // Fallback to original method if optimized fails
                    const [roundResult, playersResult, submissionsResult] = await Promise.all([
                        // Get current round data
                        getRoundData(gameID),

                        // Get all players in this game
                        supabase
                            .from('playergame')
                            .select(`*, users(username, image_url)`)
                            .eq('game_id', gameID),

                        // Get all submissions for the current game
                        getSubmissionData(gameID)
                    ]);

                    // Process round data
                    if (roundResult?.success && roundResult?.data?.prompter_id) {
                        // Cache the round data
                        setCurrentRoundData(roundResult.data);

                        // Get prompter details
                        const prompterPayload = await viewPlayerGameTable(roundResult.data.prompter_id);
                        setShowPrompterPayload(prompterPayload);

                        // Check if current user is the prompter
                        const rolePayload = await checkUserRole();
                        setIsPrompter(rolePayload?.data?.is_prompter);
                    }

                    // Cache players data if available
                    if (playersResult?.data && !playersResult.error) {
                        setAllPlayersData(playersResult.data);
                    }

                    // Cache submissions data if available
                    if (submissionsResult?.success && submissionsResult?.data) {
                        setSubmissionsData(submissionsResult.data);
                    }
                }

                // Set up real-time subscriptions
                console.log('Setting up Supabase subscriptions for game ID:', gameID);

                // Combine subscriptions into a single channel when possible to reduce overhead
                const gameChannel = supabase
                    .channel(`game-${gameID}`)
                    .on('postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'round', filter: `game_id=eq.${gameID}` },
                        mainRoundUpdateHandler)
                    .on('postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'round', filter: `game_id=eq.${gameID}` },
                        mainRoundUpdateHandler)
                    .on('postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `game_id=eq.${gameID}`},
                        mainSubmissionUpdateHandler)
                    .on('postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'playergame', filter: `game_id=eq.${gameID}` },
                        mainPlayerGameUpdateHandler)
                    .subscribe();

                // Store the subscription reference for cleanup
                return () => {
                    console.log('Cleaning up Supabase subscription');
                    supabase.removeChannel(gameChannel);
                };
            } catch(error) {
                console.log('Error in Use Effect: ' + error.message);
            };
        };

        // Start initialization
        const cleanup = initiallizeGameData();

        // Return cleanup function if available
        return () => {
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [gameID]);


  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Header with Profile */}
        {renderHeaderText()}
        <View style={styles.styleprogressBar}>
            {/* <ProgressBar duration={5000} color="#52307c" /> */}
        </View>
        <View style={styles.gameContainer}>
                {renderComponent()}
        </View>
        <View style={styles.touchContainer}>
            <View style={styles.scoreContainer}>
                <Text style={styles.score}>Score: </Text>
                <Text style={styles.score}>{showPrompterPayload?.data?.score || 0}</Text>
            </View>
            {
                renderButtons()
            }
        </View>
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalText}>Confirm your photo selection</Text>
                    {selectedImageUri && (
                        <Image source={{ uri: selectedImageUri }} style={styles.selectedImage} />
                    )}
                    <View style={styles.modalButtons}>
                        <Button title="Cancel" onPress={cancelImageSelection} />
                        <Button title="Confirm" onPress={confirmImageSelection} />
                    </View>
                </View>
            </View>
        </Modal>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121212',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
      marginTop: '10',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginLeft: 20,
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
    },
    touchContainer: {
        position: 'absolute',
        flex: 1,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        backgroundColor: "#1A1A1A",
        padding: 40,
        borderWidth: 1, 
        borderTopColor: '#333333', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 150, 
        maxHeight: 150,
    },
    scoreContainer: {
        position: 'absolute',
        top: 10,
        left: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    score: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: 16,
    },
    usernameText: {
        color: 'white',
        fontWeight: theme.fonts.extraBold,
        fontSize: 16,
    },
    text: {
        color: 'white',
        fontSize: 16,
    },
    gameContainer: {
        flex: 1,
        backgroundColor: "1A1A1A",
        justifyContent: 'center',
        alignItems: 'center',
    
    },
    Promptheader: {
        marginTop: '10',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        marginBottom: 32,
        marginLeft: 20,
      },
    styleprogressBar: {
        marginBottom: 32,
        alignItems: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'center',
    },
    modalContent: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: 300,
    },
    modalText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    selectedImage: {
        borderRadius: 10,
        height: 275,
        marginBottom: 20,
        width: 275,
    },
    
  });
  
export default Main