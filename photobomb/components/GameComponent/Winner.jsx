import { StyleSheet, Text, View, Image, Animated, Easing, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { getSupabaseUrl } from '../../service/imageService'
import ConfettiCannon from 'react-native-confetti-cannon'
import Profile from '../Profile'
import { startNextRound, endGame } from '../../service/gameStartService'
import { supabase } from '../../lib/supabase'
import FinalLeaderboard from './FinalLeaderboard'
import { getUserPayloadFromStorage } from '../../service/userService'

const Winner = ({ winnerData, currentPrompt, gameId }) => {
  const scaleAnim = useRef(new Animated.Value(0.2)).current;
  const positionAnim = useRef(new Animated.Value(200)).current;
  const [showConfetti, setShowConfetti] = useState(false);
  const [showNextRoundTimer, setShowNextRoundTimer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10); // 10 second countdown
  const [nextPrompterInfo, setNextPrompterInfo] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [allPlayerData, setAllPlayerData] = useState([]);
  const [userPayload, setUserPayload] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const timerRef = useRef(null);
  const transitionInProgress = useRef(false); // Prevent multiple simultaneous transitions
  const roundTransitionLock = useRef(false); // Add global lock for round transitions

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 300);
    
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(positionAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      })
    ]).start();
    
    // Start next round timer after celebration (5 seconds)
    const startTimerTimeout = setTimeout(() => {
      checkIfGameShouldEnd();
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(startTimerTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  useEffect(() => {
    // Fetch user payload and check if this user is the winner
    const fetchUser = async () => {
      const payload = await getUserPayloadFromStorage();
      setUserPayload(payload);
      if (payload && winnerData && winnerData.player_id) {
        setIsWinner(payload.id === winnerData.player_id);
      }
    };
    fetchUser();
  }, [winnerData]);

  const checkIfGameShouldEnd = async () => {
    try {
      if (!gameId) return;
      
      // Get the current game data to find out the current round
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("current_round")
        .eq("id", gameId)
        .single();
        
      if (gameError) {
        console.error("Error fetching game data:", gameError.message);
        return;
      }
      
      // Get players to check if everyone has been a prompter
      const { data: players, error: playersError } = await supabase
        .from("playergame")
        .select("id, turn_order, score, users (username, image_url)")
        .eq("game_id", gameId)
        .order("score", { ascending: false });
        
      if (playersError) {
        console.error("Error fetching players for game end check:", playersError.message);
        return;
      }
      
      // Store player data for the leaderboard if we need it
      setAllPlayerData(players);
      
      // If current round equals total players, game should end
      // This means every player has had a turn as the prompter
      if (gameData.current_round >= players.length) {
        console.log("Game should end - all players have been prompters!");
        
        // End the game using our new function
        const result = await endGame(gameId);
        
        if (result.success) {
          console.log("Game ended successfully");
          setAllPlayerData(result.data.allPlayers);
          setGameEnded(true);
        } else {
          console.error("Error ending game:", result.message);
          // Default to continuing to next round on error
          setShowNextRoundTimer(true);
          findNextPrompter();
          startCountdown();
        }
      } else {
        // Continue to next round
        setShowNextRoundTimer(true);
        findNextPrompter();
        startCountdown();
      }
    } catch (error) {
      console.error("Error in checkIfGameShouldEnd:", error.message);
      // Default to continuing to next round on error
      setShowNextRoundTimer(true);
      findNextPrompter();
      startCountdown();
    }
  };

  const findNextPrompter = async () => {
    try {
      if (!gameId) return;
      
      // Get the current game data to find out the current round
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("current_round")
        .eq("id", gameId)
        .single();
        
      if (gameError) {
        console.error("Error fetching game data:", gameError.message);
        return;
      }
      
      // Get players to find who's next based on turn_order
      const { data: players, error: playersError } = await supabase
        .from("playergame")
        .select("id, turn_order, users (username, image_url)")
        .eq("game_id", gameId)
        .order("turn_order", { ascending: true });
        
      if (playersError) {
        console.error("Error fetching players for next round:", playersError.message);
        return;
      }
      
      // Get the current prompter
      const { data: roundDataArray, error: roundError } = await supabase
        .from("round")
        .select("prompter_id")
        .eq("game_id", gameId)
        .eq("round", gameData.current_round)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (roundError) {
        console.error("Error fetching current round data:", roundError.message);
        return;
      }
      
      if (!roundDataArray || roundDataArray.length === 0) {
        console.error("No round data found for this game");
        return;
      }
      
      const roundData = roundDataArray[0];
      // Find current prompter index
      const prompterIndex = players.findIndex(player => player.id === roundData.prompter_id);
      
      // Calculate next prompter (wrap around if at end of array)
      const nextPrompterIndex = (prompterIndex + 1) % players.length;
      const nextPrompter = players[nextPrompterIndex];
      
      if (nextPrompter) {
        setNextPrompterInfo({
          id: nextPrompter.id,
          username: nextPrompter.users.username,
          image_url: nextPrompter.users.image_url
        });
      }
    } catch (error) {
      console.error("Error finding next prompter:", error.message);
    }
  };
  
  const startCountdown = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          if (isWinner) {
            handleNextRound();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };
  
  const handleNextRound = async () => {
    // Enhanced protection against multiple calls
    if (transitionInProgress.current || roundTransitionLock.current) {
      console.log("Round transition already in progress, skipping duplicate call");
      return;
    }
    
    try {
      // Set both locks
      transitionInProgress.current = true;
      roundTransitionLock.current = true;
      setIsTransitioning(true);
      
      if (!gameId) {
        console.error("Missing gameId for next round");
        return;
      }
      
      console.log("Starting next round transition for game:", gameId);
      
      // Clear any existing timers first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Add a small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call our new startNextRound function to advance to the next round
      const result = await startNextRound(gameId);
      
      if (!result.success) {
        console.error("Error advancing to next round:", result.message);
        Alert.alert("Error", "Failed to start next round. Please try again.");
      } else {
        console.log("Advanced to next round successfully:", result);
        // Add a delay before releasing the lock to ensure database operations complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Unexpected error in handleNextRound:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      // Always release locks
      setTimeout(() => {
        transitionInProgress.current = false;
        roundTransitionLock.current = false;
        setIsTransitioning(false);
      }, 1000); // Extended delay to ensure all operations complete
    }
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Reset locks on unmount
      transitionInProgress.current = false;
      roundTransitionLock.current = false;
    };
  }, []);

  if (!winnerData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading winner information...</Text>
      </View>
    );
  }
  
  if (gameEnded) {
    return <FinalLeaderboard gameId={gameId} playerData={allPlayerData} />;
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <LinearGradient
          colors={['#d3d3d3', '#e8e8e8']}
          style={styles.promptCard}
        >
          <View style={styles.promptContent}>
            <Text style={styles.promptText}>{currentPrompt}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.imageContainer}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { 
              transform: [
                { scale: scaleAnim },
                { translateY: positionAnim }
              ] 
            }
          ]}
        >
          <Image
            source={{ uri: getSupabaseUrl(winnerData.photo_uri) }}
            style={styles.winnerImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{x: -10, y: 0}}
          explosionSpeed={350}
          fallSpeed={3000}
          fadeOut={true}
        />
      )}
      
      {showNextRoundTimer && nextPrompterInfo && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerTitle}>Next Round Starting Soon</Text>
          
          <View style={styles.nextPrompterContainer}>
            <Profile 
              image_url={getSupabaseUrl(nextPrompterInfo.image_url)}
              profileSize={40} 
            />
            <Text style={styles.prompterText}>
              {nextPrompterInfo.username} will be the next prompter
            </Text>
          </View>
          
          <Text style={styles.timerText}>Next round in: {timeRemaining}s</Text>
          
          <LinearGradient
            colors={['#8A2BE2', '#DA70D6']}
            style={styles.timerBar}
          >
            <View style={[styles.timerProgress, { width: `${(timeRemaining / 10) * 100}%` }]} />
          </LinearGradient>
        </View>
      )}
      
      {isTransitioning && (
        <View style={styles.transitionOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.transitionText}>Starting next round...</Text>
        </View>
      )}
    </View>
  )
}

export default Winner

const styles = StyleSheet.create({
  animatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#121212',
    flex: 1,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden', 
  },
  profileRow: {
    flexDirection: 'row', 
  },
  header: {
    alignItems: 'column',
    width: '100%',
  },
  imageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 150,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  promptCard: {
    borderRadius: 12,
    marginTop: 5,
    padding: 2,
    width: '90%',
  },
  promptContent: {
    borderRadius: 10,
    padding: 10,
  },
  promptText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    padding: 5,
  },
  winnerImage: {
    borderRadius: 25, // Rounded corners for the image
    height: 300,
    width: 300,
  },
  // Timer styles
  timerContainer: {
    position: 'absolute',
    bottom: 30,
    width: '90%',
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  timerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  timerBar: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: 'white',
  },
  nextPrompterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  prompterText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  transitionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  }
})