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


// Setting
/*  */
const Main = () => {
    const router = useRouter()
    const [userPayload, setUserPayload] = useState(null); 
    const [currentStage, setCurrentStage] = useState('Prompt'); 
    const [isPrompter, setIsPrompter] = useState('Prompt');


    const components =  {
        Prompt: <PromptCard text="A cat Photo." author='billyBob' />,
        ImageGallery:  <Gallery/>,
        UserPromptSelection: <PromptSelection/>

    }

    // fetching the user data form the local storag
    
    useEffect(() => {
        const fetchUserData = async () => {
            const data = await getUserPayloadFromStorage();
            if (data) {
                setUserPayload(data);
            }
        };
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