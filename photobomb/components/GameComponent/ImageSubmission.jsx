import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getUserPayloadFromStorage } from '../../service/userService';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ImageSubmission = ({
    currentPrompt,
    gameId,
    
}) => {

  const handleSumbissionTables = async () => {
    const {data: gamesPayload, error: gamesPayloadError} = await supabase
      .from('games')
      .select(`*,
               playergame (game_id, id)`)
      .eq('id', gameId)


    if (gamesPayloadError) {
      console.error('Error fetching game data: ', gamesPayloadError.message);
      return {success: false, error: gamesPayloadError.message};
    }


    console.log('gamesPayload: ', gamesPayload);

  }





  useEffect(() => {
  }, []);
  






  return (
    <View>
      <LinearGradient
        colors={['#d3d3d3', '#e8e8e8']}
        style={[styles.card]}
      >
        <View style={styles.card}>
            <View style={styles.content}>
                <Text style={[styles.promptText]}>
                  {currentPrompt}
                </Text>
            </View>
        </View>
      </LinearGradient>
    </View>
  )
}


export default ImageSubmission

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