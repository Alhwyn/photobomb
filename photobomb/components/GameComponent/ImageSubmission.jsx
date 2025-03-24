import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ImageListPromptSelection from './ImageListPromptSelection';


const ImageSubmission = ({currentPrompt, gameId }) => {

  const [playerGamesList, setPlayerGamesList] = useState([]);
  const [playersubmissionsList, setPlayersubmissionsList] = useState([]);
  const [userPayload, setUserPayload] = useState(null);

  useEffect(() => {
    handleSumbissionTables();

    const submissionsSubscription = supabase
      .channel('submissions-channel')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          console.log('Submission update received:', payload);
          handleSumbissionTables();
        }
      )
      .subscribe();

    return () => {
      submissionsSubscription.unsubscribe();
    };
  }, [gameId]);

  const handleSumbissionTables = async () => {
    const {data: gamesPayload, error: gamesPayloadError} = await supabase
    .from('playergame')
    .select(`*,
             users (username, image_url, id) `)
    .eq('game_id', gameId);

    const {data: submissionsPayload, error: submissionsPayloadError} = await supabase
      .from('submissions')
      .select(`*`)
      .eq('game_id', gameId);

    if (submissionsPayloadError) {
      console.error('Error fetching submission data: ', submissionsPayloadError.message);
      return {success: false, error: submissionsPayloadError.message};
    }

    if (gamesPayloadError) {
      console.error('Error fetching game data: ', gamesPayloadError.message);
      return {success: false, error: gamesPayloadError.message};
    }

    console.log('gamesPayload: ', gamesPayload);

    console.log('submissionsPayload: ', submissionsPayload);

    setPlayersubmissionsList(submissionsPayload);
    setPlayerGamesList(gamesPayload);
  }
  
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
      <ImageListPromptSelection lobbyData={playerGamesList} submissionData={playersubmissionsList} />
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