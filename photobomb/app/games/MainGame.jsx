import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Button from '../../components/Button';
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Profile from '../../components/Profile';
import { theme } from '../../constants/theme';
import { getUserPayloadFromStorage } from '../../service/userService';
import PromptCard from '../../components/GameComponent/PromptCard';
import Gallery from '../../components/GameComponent/Gallery';
import PromptSelection from '../../components/GameComponent/PromptSelection';
import ProgressBar from '../../components/GameComponent/ProgressBar';
import { supabase } from '../../lib/supabase';
import { getRoundData } from '../../service/gameService';
import Prompter from '../../components/GameComponent/Prompter';
import GameLoading from '../../components/GameComponent/GameLoading';
import ImageSubmission from '../../components/GameComponent/ImageSubmission';

const Main = () => {
    const router = useRouter()
    const [userPayload, setUserPayload] = useState(null); 
    const [currentStage, setCurrentStage] = useState('Prompt'); 
    const [showPrompterPayload, setShowPrompterPayload] = useState(null);

    const [isPrompter, setIsPrompter] = useState(null);
    const [isPrompterSubmit, setIsPrompterSubmit] = useState(false);

    const [gameID, setGameId] = useState(null);
    const [selectedPrompt, setSelectedPrompt] = useState(null);

    const handlePromptSelect = (promptData) => {
        setSelectedPrompt(promptData);
        setIsPrompterSubmit(true);
        console.log('Selected prompt in Main: ', promptData);
    };

    const renderComponent = () => {

        const components =  {
            Prompt: <Prompter onPromptSelect={handlePromptSelect}/>,
            ImageGallery:  <Gallery/>,
            UserPromptSelection: <PromptSelection/>,
            WaitPrompter: <GameLoading/>,
            HandleImageSubmit: <ImageSubmission/>
    
        }

        console.log('this is the game stage: ', currentStage);

        if (currentStage === 'Prompt') {

            if (isPrompter) {
                return <Prompter onPromptSelect={handlePromptSelect} />;
            } else {
                return <GameLoading />;
            }

        } else if (currentStage === 'ImageGallery') {
            
            return <ImageSubmission currentPrompt={selectedPrompt?.text} gameId={gameID}/>;
        }
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
            // Non-prompter view
            return currentStage === 'ImageGallery' ? (
                <Button
                    title='Upload Image'
                    colors={theme.buttonGradient.primary}
                    onPress={handleImageUpload}
                />
            ) : (
                <Button
                    title='Upload Image'
                    colors={theme.buttonGradient.disabled}
                    onPress={handleImageUpload}
                />
            );
        }
    };

    const handleImageUpload = () => {
        console.log('Image upload');

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
    
                console.log('Fetched data: ', data);
                console.log('This is the game data in MainGame: ', data.playergame[0].game_id);
    
                setGameId(data.playergame[0].game_id);

                if (error) {
                    console.error('Somehting went wrong with fetching user data MainGame.jsx', error.message);
                }

                console.log('Retreiving player data went succesful: ', data);
                console.log('This is the game id: ', gameID);
            }
        } catch(error) {
            console.error('Somehting went wrong with fetching user data MainGame.jsx', error.message);
        }
    };

    const mainGameUpdateHandler = async (payload) => {
        try {

            console.log('Thsi is the paylaod of the mainGameUpdateHandler: ', payload);


            console.log('This is the game id: ', gameID);
            console.log('This is the user prompt id: ', payload?.new?.prompt_id);

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

                console.log('This is the prompt data: ', promptDataTable);

                setSelectedPrompt(promptDataTable);


                setCurrentStage('ImageGallery')
            }

        } catch(error) {
            console.error('Error in the mainGameUpdateHandler: ', error.message);
        }
    };


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

                console.log('the payload:', fetchPlayerGameData);

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
                console.log('Fetched the paylaod of the dataPLayerGame: ', dataPlayerGame);

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

            if (PromptSumbitDataError) {
                console.error('Error in PrompterButtonSubmit: ', PromptSumbitDataError.message);
                return {success: false, message: PromptSumbitDataError.message};
            }

            console.log('PrompterButtonSubmit: ', PromptSubmitData);
            

        } catch(error) {
            console.error('Error in PrompterButtonSubmit: ', error.message);
        }

    };

    useEffect(() => {
        const initiallizeGameData = async () => {
            try {

                await fetchUserData();
                const RoundDataPayload = await getRoundData(gameID);
                console.log('this is the Round data bob: ', RoundDataPayload);
                const RetreivePrompterPayload = await viewPlayerGameTable(RoundDataPayload?.data?.prompter_id);

                console.log('Recieve teh RetreivePrompterPayload in teh bobby wegjweegj: ', RetreivePrompterPayload);

                // get the state of username of the of the palyoad of the 
                setShowPrompterPayload(RetreivePrompterPayload);
                console.log('This is the set Round payload:', showPrompterPayload);
                const GetRolePlayerBool = await checkUserRole();
                console.log('this is the GetRolePlayerBool: ', GetRolePlayerBool);

                // boolean of the user client selection of the game
                console.log(GetRolePlayerBool?.data?.is_creator);
                setIsPrompter(GetRolePlayerBool?.data?.is_creator); 

            } catch(error) {
                console.error('Error in USe Effect: '. error.message);
            };
            
        };

        initiallizeGameData();

        const roundSubscription = supabase
            .channel('roundUpdates')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'round', filter: `game_id=eq.${gameID}` }, mainGameUpdateHandler)
            .subscribe();


        return () => {
            supabase.removeChannel(roundSubscription);
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
                    <Text style={styles.text}>You are the Prompter</Text>
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
    }
  });
  
export default Main