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
    const [isPrompter, setIsPrompter] = useState(false);
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
                console.log('Fetched data: ', data.games[0]?.id);
    
                setGameId(data.games[0]?.id);

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
            const getRoundPayload = await getRoundData(gameID);

            console.log('sasdasdas', getRoundPayload?.data?.prompter_id);

            const {data: fetchPlayerGameData, error: playerGameError} = await supabase
                .from('playergame')
                .select('*')
                .eq('id', getRoundPayload?.data?.prompter_id)
                .single();

            console.log('dafadfadsfdasfsdf', fetchPlayerGameData);

            if (fetchPlayerGameData.is_creator) {
                setIsPrompter(getRoundPayload?.data?.prompter_id);

                console.log('set up the prompter: ', isPrompter);

            }

        } catch(error) {
            console.error('Error in teh checkUserRole: ', error.message)
        }
    }

    const fetchPrompterData = async (gameId) => {
        /**
         * before teh game start will use the prompter userid to get the image url and the username for the 
         * game form the round tabel and query in the relational database in the user table
         */

        try {

            const getRoundDataPayload = await getRoundData(gameId);

            if (!getRoundDataPayload?.success) {
                console.log('Their is an error on fetching the round payload in MainGame: ', getRoundDataPayload.message);
            }

            console.log('got the data paylaod', getRoundDataPayload?.data);

            console.log('this is the prompter id: ', getRoundDataPayload?.data?.prompter_id);

            const getPrompterPayload = await getUserData(getRoundDataPayload?.data?.prompter_id);

            console.log('this is the prompter data in the user table', getPrompterPayload);
        } catch(error) {
            console.error('error on the function fetchPrompterData', error.message); 

        }
    }

    useEffect(() => {
        fetchUserData();

        checkUserRole();

        fetchPrompterData(gameID);
    }, []);

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