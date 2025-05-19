import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ImageListPromptSelection from './ImageListPromptSelection';
import { getSubmissionData } from '../../service/gameService';


const ImageSubmission = ({currentPrompt, gameId }) => {

  const [playerGamesList, setPlayerGamesList] = useState([]);
  const [playersubmissionsList, setPlayersubmissionsList] = useState([]);

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
      
          handleSumbissionTables();
        }
      )
      .subscribe();

    return () => {
      submissionsSubscription.unsubscribe();
    };
  }, [gameId]);

  const handleSumbissionTables = async () => {
    // Get the current round data to identify the prompter
    const {data: roundDataArray, error: roundError} = await supabase
      .from('round')
      .select('*')
      .eq('game_id', gameId)
      .order('round', { ascending: false })
      .limit(1);
      
    if (roundError) {
      console.error('Error fetching current round data: ', roundError.message);
      return {success: false, error: roundError.message};
    }
    
    if (!roundDataArray || roundDataArray.length === 0) {
      console.error('No round data found for this game');
      return {success: false, error: 'No round data found'};
    }
    
    const roundData = roundDataArray[0];
    
    const prompterId = roundData?.prompter_id;
    console.log('Current round prompter ID:', prompterId);
    
    const {data: gamesPayload, error: gamesPayloadError} = await supabase
    .from('playergame')
    .select(`*,
             users (username, image_url, id) `)
    .eq('game_id', gameId);

    const submissionsPayload = await getSubmissionData(gameId);

    if (!submissionsPayload.success) {
      console.error('Error fetching submission data: ', submissionsPayload.message);
      return {success: false, error: submissionsPayload.message};
    }

    if (gamesPayloadError) {
      console.error('Error fetching game data: ', gamesPayloadError.message);
      return {success: false, error: gamesPayloadError.message};
    }

    // Log the data being set to verify
    console.log('Players in game:', gamesPayload.map(player => ({
      id: player.id,
      username: player.users.username,
      isCreator: player.is_creator,
      isPrompter: player.id === prompterId
    })));
    
    console.log('Submissions data:', submissionsPayload.data.map(sub => ({
      id: sub.id,
      player_id: sub.player_id,
      photo_uri: sub.photo_uri ? 'Has photo' : 'No photo'
    })));

    // Only include players who are not the prompter
    const filteredPlayers = gamesPayload.filter(player => prompterId && player.id !== prompterId);
    
    setPlayersubmissionsList(submissionsPayload.data);
    setPlayerGamesList(filteredPlayers);
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
    width: '100%',
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