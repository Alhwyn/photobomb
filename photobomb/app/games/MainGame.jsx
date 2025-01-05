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


// Setting
/*  */
const Main = () => {
    const router = useRouter()
    const [userPayload, setUserPayload] = useState(null); 
    const [currentStage, setCurrentStage] = useState('Prompt'); 
    const [isPrompter, setIsPrompter] = useState(false);
    const [gameID, setGameID] = useState(null);


    const components =  {
        Prompt: <PromptCard text="A cat Photo." author='billyBob' />,
        ImageGallery:  <Gallery/>,
        UserPromptSelection: <PromptSelection/>

    }

    // fetching the user data form the local storage
    const fetchUserData = async () => {
        try {
            const Userpayload = await getUserPayloadFromStorage();
            if (Userpayload) {
                setUserPayload(Userpayload);

                const { data, error: playerError } = await supabase
                .from('users')
                .select(`*,
                    games (game_pin, id),
                    playergame (is_creator)
                `)
                .eq('id', Userpayload?.id)
                .single();

                if (playerError) {
                    console.log('Somehting went wrong with fetching user data MainGame.jsx', error.message);
                }

                console.log('Retreiving player data went succesful: ', data);
                setGameID(data?.games?.[0]?.id);
                console.log('This is the game id: ', gameID);
            }
        } catch(error) {
            console.log('Somehting went wrong with fetching user data MainGame.jsx', error.message);
        }
        
    };

    const checkUserRole = async () => {

        // 

        

    }
    
    useEffect(() => {
        // got the userpayload from asyn storage
        fetchUserData();


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