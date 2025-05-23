import { StyleSheet, Text, View, SafeAreaView, Image } from 'react-native'
import { useEffect, useState } from 'react'
import { getSupabaseUrl } from '../../service/imageService'
import ConfettiCannon from 'react-native-confetti-cannon'
import { theme } from '../../constants/theme'
import Button from '../Button'
import { useRouter } from 'expo-router'

const FinalLeaderboard = ({ playerData, promptText }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [winners, setWinners] = useState([]);
  const router = useRouter();

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

  const handleBackToMain = () => {
    router.replace('/Main');
  };

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
      <View style={styles.buttonContainer}>
        <Button
          title="Back to Main Lobby"
          colors={theme.buttonGradient.primary}
          onPress={handleBackToMain}
          width="80%"
        />
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
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  topPlayerImageCenter: {
    width: 100,
    height: 100,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
})
