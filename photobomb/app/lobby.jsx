import { SafeAreaView, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native'
import React from 'react'
import Button from '../components/Button'
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar'
import { wp } from '../helpers/common'
import { useRouter } from 'expo-router'
import Input from '../components/Input'
import Profile from '../components/Profile';
import { theme } from '../constants/theme';
// Setting

const lobby = () => {
    const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Header with Profile */}
        <View style={styles.header}> 
            {/* Profile Pic Compnonent */}
            <Profile/>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={{color: 'white'}}>Setting</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.textCenter}>
            <Text style={styles.bombText}>Photo</Text>
            <LinearGradient 
                colors={['#8A2BE2', '#DA70D6', '#BA55D3']}
                style={styles.bombTextGradient}
            >
                <Text style={styles.bombText}>Bomb</Text>
            </LinearGradient>
        </View>
        <View style={styles.touchContainer}>
            <Button
                title="Create Game"
                colors={theme.buttonGradient.primary} // Blue to Indigo
                onPress={()=> router.push('gameSelector')}
            />
            <Button 
                title='Join Game' 
                colors={theme.buttonGradient.secondary} 
                onPress={() => console.log('Join Game Pressed')}
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
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
    },
    touchContainer: {
        gap: 20,
        marginBottom: 150, // Add some space between the buttons and the bottom
        justifyContent: 'flex-end', // Push the buttons to the bottom
        flex: 1, // Let this container take up all remaining space
    },
    textCenter: {
        flex: 1,
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
    },
    bombTextGradient: {
        borderRadius: 8, // Round the corners of the gradient background
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    bombText: {
        color: 'white',
        fontSize: 36, // Make it large
        fontWeight: '600', // Semi-bold for "pop"
        textAlign: 'center',
    },
  });
  
  
export default lobby