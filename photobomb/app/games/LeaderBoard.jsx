import { StyleSheet, Text, View, FlatList, SafeAreaView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import Profile from '../../components/Profile'
import { getSupabaseUrl } from '../../service/imageService'
import { theme } from '../../constants/theme'
import Button from '../../components/Button'
import { useRouter } from 'expo-router'

const LeaderBoard = ({ route }) => {
  const [playerData, setPlayerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameId, setGameId] = useState(route?.params?.gameId);
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboardData();
  }, [gameId]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      if (!gameId) {
        // If no gameId provided, get the most recent completed game
        const { data: recentGames, error: recentError } = await supabase
          .from('games')
          .select('id')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (recentError) {
          console.error('Error fetching recent games:', recentError.message);
          setLoading(false);
          return;
        }
        
        if (recentGames && recentGames.length > 0) {
          setGameId(recentGames[0].id);
        } else {
          setLoading(false);
          return;
        }
      }
      
      // Fetch player data for the game
      const { data: players, error: playersError } = await supabase
        .from('playergame')
        .select('id, score, users (username, image_url)')
        .eq('game_id', gameId)
        .order('score', { ascending: false });
        
      if (playersError) {
        console.error('Error fetching player data:', playersError.message);
        setLoading(false);
        return;
      }
      
      setPlayerData(players);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchLeaderboardData:', error.message);
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.replace('/Main');
  };

  const getMedalColor = (index) => {
    if (index === 0) return ['#FFD700', '#FFC000']; // Gold
    if (index === 1) return ['#C0C0C0', '#A0A0A0']; // Silver
    if (index === 2) return ['#CD7F32', '#B87333']; // Bronze
    return ['#4B0082', '#9400D3']; // Purple for other positions
  };

  const renderPlayerItem = ({ item, index }) => {
    return (
      <LinearGradient
        colors={getMedalColor(index)}
        style={styles.playerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        
        <View style={styles.playerInfo}>
          <Profile 
            image_url={getSupabaseUrl(item.users?.image_url)}
            profileSize={40}
          />
          <Text style={styles.playerName}>{item.users?.username || 'Unknown Player'}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}</Text>
        </View>
      </LinearGradient>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleText}>Leaderboard</Text>
      
      {playerData.length === 0 ? (
        <Text style={styles.noGamesText}>No game data available</Text>
      ) : (
        <FlatList
          data={playerData}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayerItem}
          style={styles.leaderboardList}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <Button
        title="Back to Home"
        colors={theme.buttonGradient.primary}
        textColor="#fff"
        onPress={handleBackToHome}
        style={styles.homeButton}
      />
    </SafeAreaView>
  );
};

export default LeaderBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  leaderboardList: {
    width: '100%',
  },
  listContent: {
    paddingBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    borderRadius: 10,
    marginBottom: 10,
    padding: 12,
    alignItems: 'center',
  },
  rankContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  scoreContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  scoreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    marginVertical: 20,
    width: '80%',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  noGamesText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  }
});