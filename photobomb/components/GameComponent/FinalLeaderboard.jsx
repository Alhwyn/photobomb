import { StyleSheet, Text, View, SafeAreaView, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { getSupabaseUrl } from '../../service/imageService'
import ConfettiCannon from 'react-native-confetti-cannon'
import { theme } from '../../constants/theme'

const FinalLeaderboard = ({ playerData, promptText }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 500);
    if (playerData && playerData.length > 0) {
      const sortedPlayers = [...playerData].sort((a, b) => b.score - a.score);
      const highestScore = sortedPlayers[0].score;
      setWinners(sortedPlayers.filter(player => player.score === highestScore));
    }
    return () => clearTimeout(timer);
  }, [playerData]);

  // Prepare top 3 players for the new UI
  const sortedPlayers = playerData ? [...playerData].sort((a, b) => b.score - a.score) : [];
  const top3 = sortedPlayers.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titleText}>Game Over!</Text>
      {winners.length > 0 && (
        <View style={styles.winnersContainer}>
          <Text style={styles.winnerTitle}>{winners.length > 1 ? "It's a Tie!" : 'Winner'}</Text>
          {winners.length > 1 && (
            <Text style={styles.tieMessage}>Multiple winners with the same score!</Text>
          )}
          {promptText && <Text style={styles.promptText}>{promptText}</Text>}
        </View>
      )}
      {/* Top 3 Players UI */}
      <View style={styles.topThreeContainer}>
        {top3.map((player, idx) => {
          const isCenter = idx === 1;
          return (
            <View key={player.id} style={[styles.topPlayerContainer, isCenter && styles.topPlayerCenter]}>
              <Image
                source={{ uri: getSupabaseUrl(player.users?.image_url) }}
                style={[styles.topPlayerImage, isCenter && styles.topPlayerImageCenter]}
              />
              <Text style={styles.topPlayerUsername}>{player.users?.username}</Text>
              <Text style={styles.topPlayerScore}>{player.score}</Text>
            </View>
          );
        })}
      </View>
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          explosionSpeed={350}
          fallSpeed={2000}
          fadeOut={true}
        />
      )}
    </SafeAreaView>
  );
};

export default FinalLeaderboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  tieMessage: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  promptText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    width: '100%',
    marginVertical: 20,
  },
  topPlayerContainer: {
    alignItems: 'center',
  },
  topPlayerCenter: {
    marginBottom: 0,
  },
  topPlayerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#8A2BE2',
  },
  topPlayerImageCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#8A2BE2',
  },
  topPlayerUsername: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  topPlayerScore: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
