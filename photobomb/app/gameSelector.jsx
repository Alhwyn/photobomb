import React from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, ImageBackground, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
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
const GameSelector = () => {
  const router = useRouter();

  const createGame = async (gameMode) => {
    console.log("Running createGame function...");
    try {
      const data = await getUserPayloadFromStorage();

      
      if (!data) throw new Error('User ID not found in AsyncStorage.');

      const pin = await generateUniquePin();

      const result = await CreateGameID(pin, data);
      const getGamePayload = await getGameId(data?.id)

      console.log('result in gameselector: ', result);
      console.log('result in getGamePayload', getGamePayload);

      const createPlayerGame = await addUserToLobby(data?.id, getGamePayload?.data?.id, true);

      console.log("Game created:", result);

      router.push({
        pathname: 'Lobby'
    });

    } catch(error) {
      console.error('Game Creation has Failed', error.message);
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
      <BackButton/>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          Select Game 
        </Text>
      </View>
      <FlatList style={{backgroundColor: '#121212'}}
        data={gameModes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
      />


    </SafeAreaView>
  );
};

export default GameSelector;

const styles = StyleSheet.create({
  bigContainer: {
    flex: 1,
    backgroundColor: '#121212',
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
  }
});
