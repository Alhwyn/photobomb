import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity, Modal, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import Button from '../../components/Button';
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Profile from '../../components/Profile';
import { theme } from '../../constants/theme';
import { getUserPayloadFromStorage } from '../../service/userService';
import Gallery from '../../components/GameComponent/Gallery';
import PromptSelection from '../../components/GameComponent/PromptSelection';
import ProgressBar from '../../components/GameComponent/ProgressBar';
import { supabase } from '../../lib/supabase';
import { getRoundData } from '../../service/gameService';
import Prompter from '../../components/GameComponent/Prompter';
import GameLoading from '../../components/GameComponent/GameLoading';
import ImageSubmission from '../../components/GameComponent/ImageSubmission';
import { checkAllPlayerSubmission, getSubmissionData } from '../../service/gameService'

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

    const handlePromptSelect = (promptData) => {
        setSelectedPrompt(promptData);
        setIsPrompterSubmit(true);
        }
    
    const renderComponent = () => {
        /**
         * Prompt: <Prompter onPromptSelect={handlePromptSelect}/>,
           ImageGallery:  <Gallery/>,
            UserPromptSelection: <PromptSelection/>,
            WaitPrompter: <GameLoading/>,
            HandleImageSubmit: <ImageSubmission/>
         */
            
        console.log('this is the game stage: ', currentStage);

        if (currentStage === 'Prompt') {

            if (isPrompter) {
                return <Prompter onPromptSelect={handlePromptSelect} />;
            } else {
                return <GameLoading />;
            }
        } else if (currentStage === 'ImageGallery') {
            
            return <ImageSubmission currentPrompt={selectedPrompt?.text} gameId={gameID}/>;

        } else if (currentStage === 'UserImageSelection') {
            if (isPrompter) {
                return <PromptSelection />;
            } else {    
                return <GameLoading />;
            }
        } else if (currentStage === 'GalleryTime') {
            return <Gallery />;
        };

    };

    const renderButtons = () => {
        if (isPrompter) {
            if (currentStage === 'Prompt') {
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
                        width='50%'
                    />
                );
            } else if (currentStage === 'ImageGallery') {
                return (
                    <Button
                        title='You are the prompter'
                        colors={theme.buttonGradient.primary}
                        onPress={() => console.log('Submit')}
                    />
                );
            }
        } else {
            return currentStage === 'ImageGallery' ? (
                <Button
                    title='Upload Image'
                    colors={theme.buttonGradient.primary}
                    onPress={handleSelectImage}
                />
            ) : (
                <Button
                    title='Upload Image'
                    colors={theme.buttonGradient.disabled}
                    onPress={handleSelectImage}
                />
            );
        }
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
                    console.error('Somehting went wrong with fetching user data MainGame.jsx', error.message);
                }

            }
        } catch(error) {
            console.error('Somehting went wrong with fetching user data MainGame.jsx', error.message);
        }
    };

    const mainRoundUpdateHandler = async (payload) => {
        try {

            if (payload?.eventType === 'UPDATE') {

                const {data: promptDataTable, error: promptDataError} = await supabase
                    .from('prompts')
                    .select(`*`)
                    .eq('id', payload?.new?.prompt_id)
                    .single();

                if (promptDataError) {
                    console.error('Error in the mainGameUpdateHandler: ', promptDataError.message);
                    return {success: false, message: promptDataError.message};
                }

                setSelectedPrompt(promptDataTable);

                setPromptSubmitted(true);
                setCurrentStage('ImageGallery');
            }

        } catch(error) {
            console.error('Error in the mainGameUpdateHandler: ', error.message);
        }
    };

    const mainSubmissionUpdateHandler = async (payload) => {
        try {
            if (payload?.eventType === 'UPDATE') {
                const { data: submissions, error } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('game_id', gameID);
    
                if (error) {
                    console.error('Error checking submissions:', error.message);
                    return {success: false, message: error.message};;
                }

                const submissionStatus = await checkAllPlayerSubmission();

                if (submissionStatus) {
                    setCurrentStage('GalleryTime'); 
                };

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
                console.error('Error in the checkUserRole:  ', playerGameError.message);
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
                console.error('Error on View PlayerGameTable: ', error.message)
                return {success: false, message: error.message}
            }

            return {success: true, data: dataPlayerGame}
        } catch(error) {
            console.error('Error on View PlayerGameTable: ', error.message)
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
                await createSubmissionsForPlayers();
                setCurrentStage('ImageGallery');
                

            } else {
                console.error('Error in PrompterButtonSubmit: ', PromptSumbitDataError.message);
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
                quality: 0.7,
            });

            if (!result.cancelled) {   
                console.log('this is the result: ', result);
                console.log('this is the uri', result?.assets?.[0]?.uri);
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
            console.error('Supabase storage upload error:', error.message);
            return {success: false, message: error.message};
          }
      
          return {success: true, message: data}

          
        } catch (error) {
          console.error('Image upload failed:', error.message);
          return {success: false, message: error.message};
        }
      };

      const checkAllPlayerSubmission = async () => {

        const roundData = await getRoundData(gameID);

        console.log('this is the roundData \n\n: ', roundData.data.total_players);


        const submissionData = await getSubmissionData(gameID);

        const allSubmitted = submissionData.data.every(submission => submission.photo_uri !== null);

        console.log('this is the submissionData: ', submissionData.data);

        return allSubmitted;

      }

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
                console.error('Error in createSubmissionsForPlayers: ', roundError.message);
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
            console.error('Error in createSubmissionsForPlayers: ', error.message);
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
            console.error('Error in confirmImageSelection: ', playergameError.message);
            return {success: false, message: playergameError.message};
        }

        const fileName = selectedImageUri.split('/').pop();
        const photoUri = `gamesubmissions/${fileName}`;
        const playerGameId = playergameData.id;

        const {data, error} = await supabase
            .from('submissions')
            .update({
                photo_uri: photoUri,
            })
            .eq('game_id', gameID)
            .eq('player_id', playerGameId)


        if (error) {
            console.error('Error in confirmImageSelection: ', error.message);
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
                console.error('Error in Use Effect: '. error.message);
            };
            
        };

        initiallizeGameData();

        const roundSubscription = supabase
            .channel('roundUpdates')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'round', filter: `game_id=eq.${gameID}` }, mainRoundUpdateHandler)
            .subscribe();

        const submissionSubscription = supabase
            .channel('submissionUpdates')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `game_id=eq.${gameID}` }, mainSubmissionUpdateHandler)
            .subscribe();


        return () => {
            supabase.removeChannel(roundSubscription);
            supabase.removeChannel(submissionSubscription);
        }
    }, [gameID]);


  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Header with Profile */}
        <View style={styles.header}> 
            {/* Profile Pic Component */}
            <Profile image_url={userPayload?.image_url}/>
             
            <Text style={styles.usernameText}>{showPrompterPayload?.data?.users?.username}</Text>
            {isPrompter ? (
                    promptSubmitted ? (
                        <Text style={styles.text}> picked the prompt</Text>
                    ) : (
                        <Text style={styles.text}>You are the Prompter</Text>
                    )
                ) : (
                    <Text style={styles.text}>is picking a prompt...</Text>
             )}
        </View>
        <View style={styles.styleprogressBar}>
            <ProgressBar duration={5000} color="#52307c" />
        </View>
        <View style={styles.gameContainer}>
                {renderComponent()}
        </View>
        <View style={styles.touchContainer}>
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
        padding: 90,
        borderWidth: 1, 
        borderTopColor: '#333333', 
        justifyContent: 'center', 
        alignItems: 'center', 
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

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        marginBottom: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectedImage: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
  });
  
export default Main