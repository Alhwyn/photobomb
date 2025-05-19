import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity, Modal, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
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
import GameLoading from '../../components/GameComponent/GameLoading';
import ImageSubmission from '../../components/GameComponent/ImageSubmission';
import { getSubmissionData } from '../../service/gameService'
import { getSupabaseUrl } from '../../service/imageService';
import Winner from '../../components/GameComponent/Winner';

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const Main = () => {
    const router = useRouter()
    const [userPayload, setUserPayload] = useState(null); 
    const [currentStage, setCurrentStage] = useState('Prompt'); 
    const [showPrompterPayload, setShowPrompterPayload] = useState(null);

    const [isPrompter, setIsPrompter] = useState(null);
    const [isPrompterSubmit, setIsPrompterSubmit] = useState(false);

    const [gameID, setGameId] = useState(null);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [promptSubmitted, setPromptSubmitted] = useState(false);
    const [imagesSelected, setImagesSelected] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);

    const [winnerData, setWinnerData] = useState(null);

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
                return <GameLoading />;
            }
        } else if (currentStage === 'ImageGallery') {
            return <ImageSubmission currentPrompt={selectedPrompt?.text} gameId={gameID}/>;
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
            return;
        };
    };

    const renderHeaderText = () => {
        if (currentStage === 'Prompt') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(userPayload?.image_url)}/>
                    
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>picking the prompt...</Text>
                    
                </View>
            )
        } else if (currentStage === 'ImageGallery') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(userPayload?.image_url)}/>
                    
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>picked the prompt...</Text>
                    
                </View>
            )
        } else if (currentStage === 'GalleryTime') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(userPayload?.image_url)}/>
                    
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>picking the winner...</Text>
                    
                </View>
            )

        } else if (currentStage === 'Winner') {
            return (
                <View style={styles.header}> 
                    {/* Profile Pic Component */}
                    <Profile image_url={getSupabaseUrl(winnerData?.image_url)}/>
                    
                    <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
                    <Text style={styles.text}>got the best photo for</Text>
                    
                </View>
            )
        };
    };


    const fetchUserData = async () => {
        try {
            const Userpayload = await getUserPayloadFromStorage();
            if (Userpayload) {
                setUserPayload(Userpayload);

                const { data, error } = await supabase
                    .from('users')
                    .select(`*,
                                games (game_pin, id, game_creator),
                                playergame (is_creator, player_id, game_id)
                    `)
                    .eq('id', Userpayload?.id)
                    .single();
    
                setGameId(data.playergame[0].game_id);

                if (error) {
                    console.log('Somehting went wrong with fetching user data MainGame.jsx', error.message);
                }

            }
        } catch(error) {
            console.log('Somehting went wrong with fetching user data MainGame.jsx', error.message);
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

                setSelectedPrompt(promptDataTable);
                setPromptSubmitted(true);
                setCurrentStage('ImageGallery');
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
                setPromptSubmitted(false);
                setImagesSelected(false);
                setWinnerData(null);
                
                // Get new prompter info
                const retrievePrompterPayload = await viewPlayerGameTable(roundData?.data?.prompter_id);
                setShowPrompterPayload(retrievePrompterPayload);
                
                // Check if the current user is the new prompter
                const getRolePlayerBool = await checkUserRole();
                setIsPrompter(getRolePlayerBool?.data?.is_creator);
                
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

            if (payload?.eventType === 'UPDATE') {
                const submissionPayload = await getSubmissionData(gameID);
    
                if (submissionPayload.error) {
                    console.log('Error checking submissions:', submissionPayload.error.message);
                    return;
                }
                console.log('Submission data:', submissionPayload.data);
    
                const allSubmitted = submissionPayload.data.every(submission => submission.photo_uri !== null);
    
                if (allSubmitted) {
                    console.log('All players have submitted their photos.');
                    setCurrentStage('GalleryTime');
                } else {
                    console.log('Waiting for more submissions.');
                }
            }
        } catch (error) {
            console.log('Error in mainSubmissionUpdateHandler:', error.message);
        }
    };

    const mainPlayerGameUpdateHandler = async (payload) => {
        try {

            console.log('Submission update received:', payload);
            if (payload?.eventType === 'UPDATE') {
                
                const { data: data, error } = await supabase
                    .from('playergame')
                    .select(`*,
                             submissions (photo_uri),
                             users (username, image_url)`)
                    .eq('id', payload?.new?.id)
                    .single();

                if (error) {
                    console.log('Error checking submissions:', error.message);
                    return {success: false, message: error.message};;
                }

                console.log('Submission data this is the winner data:', data);
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
            const {data: fetchPlayerGameData, error: playerGameError} = await supabase
                .from('playergame')
                .select(`*,
                         users (username)`)
                .eq('player_id', userPayload?.id)
                .single();

            if (playerGameError) {
                console.log('Error in the checkUserRole:  ', playerGameError.message);
                return {success: false, message: playerGameError.message};

            }
            return {success: true, data: fetchPlayerGameData};

        } catch(error) {
            console.log('Error in the checkUserRole: ', playerGameError.message)
            return {success: false, message: playerGameError.message};
        }
    }

    const viewPlayerGameTable = async (playerGameId) => {
        try {

            const { data: dataPlayerGame, error: errorPLayerGame} = await supabase
                .from('playergame')
                .select(`*,
                         users (username, image_url)`)
                .eq('id', playerGameId)
                .single();

            if (errorPLayerGame) {
                console.log('Error on View PlayerGameTable: ', error.message)
                return {success: false, message: error.message}
            }

            return {success: true, data: dataPlayerGame}
        } catch(error) {
            console.log('Error on View PlayerGameTable: ', error.message)
            return {success: false, message: error.message}
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

            if (!PromptSumbitDataError) {
                // Note: Submissions are now created directly in the handleRoundTable function
                // when a new round is started, so we don't need to create them here
                setCurrentStage('ImageGallery');
            } else {
                console.log('Error in PrompterButtonSubmit: ', PromptSumbitDataError.message);
                return {success: false, message: PromptSumbitDataError.message};
            }
        } catch(error) {
            console.error('Error in PrompterButtonSubmit: ', error.message);
        }
    };

    const handleSelectImage = async () => {
        try {

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaType,
                allowsEditing: true,
                quality: 0.6,
            });

            if (!result.cancelled) {   
                setSelectedImageUri(result?.assets?.[0]?.uri);
                setIsModalVisible(true);
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
      
          const fileContent = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
      
          
          const fileBuffer = Uint8Array.from(atob(fileContent), (c) =>
            c.charCodeAt(0)
          );
      
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
            const {data: players, error: playersError} = await supabase
                .from('playergame')
                .select(`*,
                         users (username, image_url)`)
                .eq('game_id', gameID);

            if (playersError) {
                console.error('Error in createSubmissionsForPlayers: ', playersError.message);
                return {success: false, message: playersError.message};
            }
            const {data: roundData, error: roundError} = await supabase
                .from('round')
                .select(`*`)
                .eq('game_id', gameID)
                .single();


            if (roundError) {  
                console.log('Error in createSubmissionsForPlayers: ', roundError.message);
                return {success: false, message: roundError.message};
            }

            const submissionPromises = players
                .filter(player => !player.is_creator)
                .map(player => {
                    return supabase
                        .from('submissions')
                        .insert({
                            round_id: roundData.id,
                            player_id: player.id,
                            photo_uri: null,
                            game_id: gameID,
                        });
                });

            await Promise.all(submissionPromises);

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

        await uploadImageToSupabase(selectedImageUri);

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

        const fileName = selectedImageUri.split('/').pop();
        const photoUri = `gamesubmissions/${fileName}`;
        const playerGameId = playergameData.id;

        // Get the current round to find the player's submission
        const {data: roundData, error: roundError} = await supabase
            .from('round')
            .select(`*`)
            .eq('game_id', gameID)
            .order('round', { ascending: false })
            .limit(1)
            .single();

        if (roundError) {
            console.log('Error in confirmImageSelection fetching round: ', roundError.message);
            return {success: false, message: roundError.message};
        }

        // Now find the submission for this player in the current round
        // In the submissions table, player_id should reference the playergame.id (not the user.id)
        const {data, error} = await supabase
            .from('submissions')
            .update({
                photo_uri: photoUri,
            })
            .eq('round_id', roundData.id)
            .eq('player_id', playerGameId)


        if (error) {
            console.log('Error in confirmImageSelection: ', error.message);
            return {success: false, message: error.message};
        }

        setIsModalVisible(false);
        setImagesSelected(true);
    };

    useEffect(() => {
        const initiallizeGameData = async () => {
            try {

                await fetchUserData();
                const RoundDataPayload = await getRoundData(gameID);
                const RetreivePrompterPayload = await viewPlayerGameTable(RoundDataPayload?.data?.prompter_id);

                setShowPrompterPayload(RetreivePrompterPayload);
                const GetRolePlayerBool = await checkUserRole();
                setIsPrompter(GetRolePlayerBool?.data?.is_creator); 

            } catch(error) {
                console.log('Error in Use Effect: '. error.message);
            };
            
        };
        initiallizeGameData();

        // Listen for both round updates and new round insertions
        const roundSubscription = supabase
            .channel('roundUpdates')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'round', filter: `game_id=eq.${gameID}` }, mainRoundUpdateHandler)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'round', filter: `game_id=eq.${gameID}` }, mainRoundUpdateHandler)
            .subscribe();

        const submissionSubscription = supabase
            .channel('submissionsUpdates')
            .on('postgres_changes', 
                {event: 'UPDATE', schema: 'public', table: 'submissions', filter: `game_id=eq.${gameID}`}, mainSubmissionUpdateHandler)
            .subscribe();

        const playerGameSubscription = supabase
        .channel('playerGameUpdates')
        .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'playergame', filter: `game_id=eq.${gameID}` }, mainPlayerGameUpdateHandler)
        .subscribe();

        return () => {
            supabase.removeChannel(roundSubscription);
            supabase.removeChannel(submissionSubscription);
            supabase.removeChannel(playerGameSubscription)
        }
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
                <Text style={styles.score}>{showPrompterPayload?.data?.score}</Text>
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