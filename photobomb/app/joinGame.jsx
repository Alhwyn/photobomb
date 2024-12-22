import React from 'react';
import { FlatList, StyleSheet, Text, View, Pressable, ImageBackground, TouchableWithoutFeedback, Keyboard, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import BackButton from '../components/BackButton';
import NumberInput from '../components/NumberInput';
import Button from '../components/Button';
import { useRouter } from 'expo-router';


const GameSelector = () => {
  const router = useRouter();


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
          <NumberInput/>
          <Button 
            title='Join' 
            colors={theme.buttonGradient.secondary} 
            onPress={()=> console.log('Pressed Join game')}
          />
        </View>
       
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default GameSelector;

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
