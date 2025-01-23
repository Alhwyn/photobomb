import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient';

const PromptCard = ({ text, author="PhotoBomb", isSelected, onSelect }) => {

  const handleSelect = () => {
    console.log('PromptCard selected: ', text);
    onSelect();
  }
  return (

    <TouchableOpacity onPress={handleSelect}>
      <LinearGradient
        colors={isSelected ? ['#4a90e2', '#357abd'] : ['#d3d3d3', '#e8e8e8']}
        style={[styles.card, isSelected && styles.selectedCard]}
      >
        <View style={styles.card}>
            <View style={styles.content}>
                <Text style={[styles.promptText, isSelected && styles.selectedText]}>
                  {text}
                </Text>
            </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
   
  );
};

export default PromptCard

const styles = StyleSheet.create({
    card: {
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
    },
    content: {
      marginTop: 15,
      marginBottom: 15, 
      marginLeft: 15,
      marginRight: 15,
      alignItems: 'flex-start',
    },
    promptText: {
      fontSize: 14, 
      fontWeight: 'bold',
      textAlign: 'center',
    },
    authorText: {
      fontSize: 12, 
      color: '#666',
      fontStyle: 'italic',
      marginTop: 5,
    },
  });