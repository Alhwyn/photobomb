import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, ImageBackground, TouchableWithoutFeedback, Keyboard, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import BackButton from '../components/BackButton';
import NumberInput from '../components/NumberInput';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import { checkGamePin, addUserToLobby } from '../service/gameService';
import { getUserPayloadFromStorage } from '../service/userService';


const joinGame = () => {
  const router = useRouter();
  const [gamePin, setGamePin] = useState('');
  const [isLoading, setisLoading] = useState(false);

  const handleJoinGame = async () => {
    if (!gamePin) {
      Alert.alert('Error', 'Please Enter a game Pin');
      return;
    }

    setisLoading(true);

    try {
      const isValidPin = await checkGamePin(gamePin);

      console.log('joinGame: data success; ', isValidPin);

      if (!isValidPin.success) {
        Alert.alert('Invalid game Pin: ', 'The game entered does not exist,')
        setisLoading(false);
        return;
      }

      const userPayload = await getUserPayloadFromStorage();
      const result = await addUserToLobby(userPayload?.id, isValidPin?.data?.[0]?.id)

      if (result.success) {

        router.push({
          pathname: 'Lobby'
        })
      }

      

    } catch(error) {
      console.log('joinGame.jsx Could not join game: ', error.message);
      return;
    }
  }


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.bigContainer}>
        <BackButton/>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            Join Game  
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <NumberInput value={gamePin} onChangeText={setGamePin} />
          <Button 
            title='Join' 
            colors={theme.buttonGradient.secondary} 
            onPress={handleJoinGame}
          />
        </View>
       
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default joinGame;

const styles = StyleSheet.create({
  bigContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  title: {
    color: '#ffffff', 
    fontWeight: theme.fonts.extraBold,
    fontSize: 32,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 10,
  }, 
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 80, 
  }
  

});
