import React from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const gameModes = [
  { id: '1', name: 'Classic', image: require('../assets/images/mode1.png'), gradient: ['#0000FF', '#1E90FF']},
  { id: '4', name: 'Community', image: require('../assets/images/mode4.png'), gradient: ['#8A2BE2', '#4B0082'] },
];

const GameSelector = () => {
  const renderItem = ({ item }) => (
    <Pressable style={styles.item} onPress={() => console.log(`Selected ${item.name}`)}>
        <LinearGradient colors={item.gradient} style={styles.image} imageStyle={styles.imageBorder}>
            <View style={styles.textContainer}>
                <Text style={styles.text}>{item.name}</Text>      
            </View>
        </LinearGradient>
    </Pressable>
  );

  return (
    <FlatList style={{backgroundColor: '#121212'}}
      data={gameModes}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.container}
    />
  );
};

export default GameSelector;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#121212', // Sleek dark background
  },
  item: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden', // Ensures images don't overflow
  },
  image: {
    height: 150,
    justifyContent: 'flex-end', // Align text container at the bottom
  },
  imageBorder: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0, // Flat bottom edge
    borderBottomRightRadius: 0,
  },
  textContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.007)', // Semi-transparent black for text background
    paddingVertical: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff', // Clean white text for contrast
    fontFamily: 'System',
  },
});
