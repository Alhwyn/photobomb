import { useState } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Keyboard, SafeAreaView, Alert } from 'react-native';
import { theme } from '../constants/theme';
import NumberInput from './NumberInput';
import Button from './Button';
import { checkGamePin, addUserToLobby } from '../service/gameService';
import { getUserPayloadFromStorage } from '../service/userService';

const JoinGameComponent = ({ onBack, onSuccessfulJoin }) => {
  const [gamePin, setGamePin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleJoinGame = async () => {
    if (!gamePin) {
      Alert.alert('Error', 'Please Enter a game Pin');
      return;
    }

    setIsLoading(true);

    try {
      const isValidPin = await checkGamePin(gamePin);

      console.log('joinGame: data success; ', isValidPin);

      if (!isValidPin.success) {
        Alert.alert('Invalid game Pin: ', 'The game entered does not exist,')
        setIsLoading(false);
        return;
      }

      const userPayload = await getUserPayloadFromStorage();

      const result = await addUserToLobby(userPayload?.id, isValidPin?.data?.[0]?.id, false);
    
      if (result?.success) {
        // Call the success callback instead of navigating
        onSuccessfulJoin && onSuccessfulJoin();
      }
    } catch(error) {
      console.error('JoinGameComponent Could not join game: ', error.message);
      setIsLoading(false);
      return;
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.bigContainer}>
        <View style={styles.inputContainer}>
          <NumberInput value={gamePin} onChangeText={setGamePin} />
          <Button 
            title={isLoading ? 'Joining...' : 'Join'} 
            colors={theme.buttonGradient.primary} 
            onPress={handleJoinGame}
            disabled={isLoading}
          />
          <Button 
            title="Back" 
            colors={theme.buttonGradient.secondary} 
            onPress={onBack}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default JoinGameComponent;

const styles = StyleSheet.create({
  bigContainer: {
    backgroundColor: 'transparent',
  },
  title: {
    color: '#ffffff', 
    fontWeight: theme.fonts.extraBold,
    fontSize: 32,
  },
  inputContainer: {
    justifyContent: 'center',
    gap: 10,
    paddingLeft: 20,
    paddingRight: 10,
    marginBottom: 80, 
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 80,
  }
});
