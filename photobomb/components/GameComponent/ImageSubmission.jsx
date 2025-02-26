import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ImageList from './ImageList';
import { getUserPayloadFromStorage } from '../../service/userService';


const ImageSubmission = ({currentPrompt, gameId }) => {

  const [playerGamesList, setPlayerGamesList] = useState([]);
  const [userPayload, setUserPayload] = useState(null);


  const handleSumbissionTables = async () => {
    const {data: gamesPayload, error: gamesPayloadError} = await supabase
      .from('playergame')
      .select(`*,
               users (username, image_url)`)
      .eq('game_id', gameId);


    if (gamesPayloadError) {
      console.error('Error fetching game data: ', gamesPayloadError.message);
      return {success: false, error: gamesPayloadError.message};
    }


    console.log('gamesPayload: ', gamesPayload);

    setPlayerGamesList(gamesPayload);

  }

  const createSubmissionTables = async () => {

    const Userpayload = await getUserPayloadFromStorage();
    
    if (Userpayload) {

      setUserPayload(Userpayload);


      const {data: submissionsTable, error: submissionsTableError} = await supabase
        .from('submissions')
        .insert(`*`)
        .eq('game_id', gameId);



    }

  }


  useEffect(() => {
    handleSumbissionTables();
  }, []);
  
  return (
    <View style={styles.container}> 
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
      <ImageList lobbyData={playerGamesList} />
    </View>
  )
}


export default ImageSubmission

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  content: {
    margin: 15,
    marginLeft: 100,
    marginRight: 100,
  },
  promptText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});