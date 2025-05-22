import React from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import Button from './Button';
import { getUserPayloadFromStorage } from '../service/userService';
import { checkGamePin, CreateGameID, addUserToLobby, getGameId } from '../service/gameService';

const generateUniquePin = async () => {
    let unique = false;
    let pin;

    while (!unique) {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        unique = !(await checkGamePin(pin));
    }
    return pin; 
}

const gameModes = [
  { id: '1', name: 'Classic', image: require('../assets/images/mode1.png'), gradient: ['#0000FF', '#1E90FF']},
];

const GameSelectorComponent = ({ onBack, onSuccessfulCreate }) => {
  const createGame = async (gameMode) => {
    console.log("Running createGame function...");
    try {
      const data = await getUserPayloadFromStorage();
      
      if (!data) throw new Error('User ID not found in AsyncStorage.');

      // Generate a unique game PIN
      const pin = await generateUniquePin();
      
      // Create a new game (this will also clean up any existing games by this user)
      const result = await CreateGameID(pin, data);
      
      if (!result || !result.success) {
        console.error('Failed to create game:', result?.msg || 'Unknown error');
        Alert.alert('Error', 'Failed to create game. Please try again.');
        return;
      }
      
      // Get the newly created game data
      const getGamePayload = await getGameId(data?.id);
      
      if (!getGamePayload || !getGamePayload.success) {
        console.error('Failed to retrieve game data:', getGamePayload?.msg || 'Unknown error');
        Alert.alert('Error', 'Game was created but failed to load. Please try again.');
        return;
      }

      console.log('Game created with ID:', getGamePayload?.data?.id);
      
      // Add the user to the lobby as the creator
      const createPlayerGame = await addUserToLobby(data?.id, getGamePayload?.data?.id, true);
      
      if (!createPlayerGame || !createPlayerGame.success) {
        console.error('Failed to add user to lobby:', createPlayerGame?.msg || 'Unknown error');
        Alert.alert('Error', 'Failed to join your own game. Please try again.');
        return;
      }

      console.log("Game created and joined successfully");
      
      // Call success callback instead of navigating
      onSuccessfulCreate && onSuccessfulCreate();

    } catch(error) {
      console.error('Game Creation has Failed', error.message);
      Alert.alert('Error', 'An error occurred while creating the game. Please try again.');
    }
  }

  const renderItem = ({ item }) => (
    <Pressable style={styles.item} onPress={() => createGame(item)}> 
        <LinearGradient colors={item.gradient} style={styles.image} imageStyle={styles.imageBorder}>
            <View style={styles.textContainer}>
                <Text style={styles.text}>{item.name}</Text>      
            </View>
        </LinearGradient>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.bigContainer}>
      <FlatList style={{backgroundColor: '#121212'}}
        data={gameModes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
      />
      <View style={styles.backButtonContainer}>
        <Button 
          title="Back" 
          colors={theme.buttonGradient.secondary} 
          onPress={onBack}
          style={styles.backButton}
        />
      </View>
    </SafeAreaView>
  );
};

export default GameSelectorComponent;

const styles = StyleSheet.create({
  bigContainer: {
    backgroundColor: 'transparent',
  },
  container: {
    padding: 16,
    backgroundColor: '#121212', 
  },
  item: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden', 
  },
  image: {
    height: 150,
    justifyContent: 'flex-end', 
  },
  imageBorder: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.007)',
    paddingVertical: 8,
    paddingLeft: 15
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'System',
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
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 80,
  }
});
