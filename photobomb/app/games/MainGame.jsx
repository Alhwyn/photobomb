import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Button from '../../components/Button';
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import Profile from '../../components/Profile';
import { theme } from '../../constants/theme';
import { getUserData, getUserPayloadFromStorage } from '../../service/userService';
import PromptCard from '../../components/GameComponent/PromptCard';
import Gallery from '../../components/GameComponent/Gallery';
import PromptSelection from '../../components/GameComponent/PromptSelection';
import ProgressBar from '../../components/GameComponent/ProgressBar';
import { supabase } from '../../lib/supabase';
import { getRoundData } from '../../service/gameService';

const Main = () => {
    const router = useRouter()
    const [userPayload, setUserPayload] = useState(null); 
    const [currentStage, setCurrentStage] = useState('Prompt'); 
    const [showPrompterPayload, setShowPrompterPayload] = useState(null);
    const [isPrompterUsername, setIsPrompterUsername] = useState(false);
    const [gameID, setGameId] = useState(null);

    const components =  {
        Prompt: <PromptCard text="A cat Photo." author='billyBob' />,
        ImageGallery:  <Gallery/>,
        UserPromptSelection: <PromptSelection/>

    }
    // fetching the user data form the local storage
    // commit a day
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
    const checkUserRole = async () => {
        /**
         * in this function will look for the locat user role of the game 
         * given the game id and the player id from the round table and check if thier the prompter
         * if the user is the prompter then the state will be true and they will be a new ui and new 
         * instruction
         * 
         */
        try {
            const {data: fetchPlayerGameData, error: playerGameError} = await supabase
                .from('playergame')
                .select(`*,
                         users (username)`)
                .eq('player_id', userPayload?.id)
                .single();

                console.log('the payload: ', fetchPlayerGameData);

                console.log(`this is the fetched data of fetchPlayerGameData is_creator and this is the user ${fetchPlayerGameData.users.username}: `, fetchPlayerGameData?.is_creator);


            return {success: true, boolean: fetchPlayerGameData?.is_creator};

        } catch(error) {
            console.error('Error in the checkUserRole: ', error.message)
        }
    }

    const viewPlayerGameTable = async (playerGameId) => {
        try {

            const { data: dataPlayerGame, error: errorPLayerGame} = await supabase
                .from('playergame')
                .select(`*,
                         users (username, image_url)`)
                .eq('id', RoundDataPayload?.data?.prompter_id)
                .single();

                console.log('Fetched the paylaod of the dataPLayerGame: ', dataPlayerGame);


            if (errorPLayerGame) {
                console.error('Error on View PlayerGameTable: ', error.message)
                return {success: false, message: error.message}
            }

        } catch(error) {
            console.error('Error on View PlayerGameTable: ', error.message)
            return {success: false, message: error.message}

        }
    }

    useEffect(() => {
        const initiallizeGameData = async () => {
            try {

                await fetchUserData();

                const RoundDataPayload = await getRoundData(gameID);

                console.log('this is the Round data bob: ', RoundDataPayload);

                console.log(RoundDataPayload?.data?.prompter_id);
                console.log(RoundDataPayload?.data?.prompter_id);
                console.log(RoundDataPayload?.data?.prompter_id);
                console.log(RoundDataPayload?.data?.prompter_id);

                

                

                // get the state of username of the of the palyoad of the 

                setShowPrompterPayload(dataPlayerGame);

                console.log('Fetc the UserTablePrompter: ', UserTablePrompter);
                console.log('This is the set Round payload:', showPrompterPayload);

                


                await getPrompterPlayer();


                const GetRolePlayerBool = await checkUserRole();
                

            } catch(error) {
                console.error('Error in USe Effect: '. error.message);
            };
            
        };

        initiallizeGameData();
    }, [gameID]);

  const renderGameContainer = () => components[currentStage] || <PromptCard text="Default prompt" />;
    

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Header with Profile */}
        <View style={styles.header}> 
            {/* Profile Pic Compnonent */}
            <Profile/>
            
            <Text style={styles.usernameText}>{userPayload?.username}</Text>
            <Text style={styles.text}>is picking a prompt...</Text>
        </View>
        <View style={styles.styleprogressBar}>
            <ProgressBar duration={5000} color="#52307c" />
        </View>
        
        <View style={styles.gameContainer}>
            {renderGameContainer()}
        </View>
        <View style={styles.touchContainer}>
            <Button 
                title='Pick photo' 
                colors={theme.buttonGradient.secondary} 
                onPress={()=> setCurrentStage('Prompt')}
                width='50%'
            />
            <Button 
                title='Pick photo' 
                colors={theme.buttonGradient.secondary} 
                onPress={()=>  setCurrentStage('ImageGallery')}
                width='50%'
            />
            <Button 
                title='Pick photo' 
                colors={theme.buttonGradient.secondary} 
                onPress={()=>  setCurrentStage('UserPromptSelection')}
                width='50%'
            />
        </View>
    </SafeAreaView>
  )
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
        backgroundColor: "1A1A1A",
        justifyContent: 'center',
        alignItems: 'center'

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