import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { getSupabaseUrl } from '../../service/imageService'
import Profile from '../Profile'
import ConfettiCannon from 'react-native-confetti-cannon'

const FinalLeaderboard = ({ playerData }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [winners, setWinners] = useState([]);
  
  useEffect(() => {
    // Trigger confetti after a short delay
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);
    
    // Find the winner(s) - those with the highest score
    if (playerData && playerData.length > 0) {
      // Sort by score in descending order
      const sortedPlayers = [...playerData].sort((a, b) => b.score - a.score);
      const highestScore = sortedPlayers[0].score;
      
      // Filter to get all players with the highest score (handles ties)
      const topPlayers = sortedPlayers.filter(player => player.score === highestScore);
      setWinners(topPlayers);
      
      console.log(`Game ended with ${topPlayers.length > 1 ? 'a tie between' : 'winner:'} ${topPlayers.map(p => p.users?.username).join(', ')}`);
    }
    
    return () => clearTimeout(timer);
  }, [playerData]);
  
  const getMedalColor = (index) => {
    if (index === 0) return ['#FFD700', '#FFC000']; // Gold
    if (index === 1) return ['#C0C0C0', '#A0A0A0']; // Silver
    if (index === 2) return ['#CD7F32', '#B87333']; // Bronze
    return ['#4B0082', '#9400D3']; // Purple for other positions
  };
  
  const renderPlayerItem = ({ item, index }) => {
    const isTied = winners.length > 1 && winners.includes(item);
    const isWinner = winners.includes(item);
    
    return (
      <LinearGradient
        colors={getMedalColor(index)}
        style={[styles.playerCard, isTied && { borderWidth: 2, borderColor: '#FFD700' }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>

        <Profile 
        image_url={getSupabaseUrl(item.users?.image_url)}
        profileSize={40}
        />
        <Text style={styles.playerName}>{item.users?.username || 'Unknown Player'}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.score}</Text>
        </View>
        
        {isWinner && (
          <View style={styles.winnerBadge}>
            <Text style={styles.winnerText}>{isTied ? 'Tied' : 'Winner'}</Text>
          </View>
        )}
      </LinearGradient>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleText}>Game Over!</Text>
      
      {winners.length > 0 && (
        <View style={styles.winnersContainer}>
          <Text style={styles.winnerTitle}>
            {winners.length > 1 ? 'It\'s a Tie!' : 'Winner'}
          </Text>
          
          {winners.length > 1 && (
            <Text style={styles.tieMessage}>
              Multiple winners with the same score!
            </Text>
          )}
        </View>
      )}
      <Text style={styles.leaderboardTitle}>Final Leaderboard</Text>
      
      <FlatList
        data={playerData}
        keyExtractor={(item) => item.id}
        renderItem={renderPlayerItem}
        style={styles.leaderboardList}
        contentContainerStyle={styles.listContent}
      />
      
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{x: -10, y: 0}}
          explosionSpeed={350}
          fallSpeed={2000}
          fadeOut={true}
        />
      )}
    </SafeAreaView>
  )
}

export default FinalLeaderboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  winnersContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  winnerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  winnerAvatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  winnerAvatar: {
    alignItems: 'center',
    position: 'relative',
  },
  winnerGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -10,
    left: -10,
  },
  winnerName: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  scoreDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 5,
  },
  tieMessage: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  finalScoreText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  leaderboardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
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
    paddingLeft: 40,
    paddingRight: 40,

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
  winnerBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  winnerText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 20,
  },
  actionButton: {
    marginVertical: 8,
    width: '100%',
  },
  homeButton: {
    marginVertical: 20,
    width: '80%',
  }
})
