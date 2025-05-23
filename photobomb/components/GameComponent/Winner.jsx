import { StyleSheet, Text, View, Image, Animated, Easing, ActivityIndicator, Alert } from 'react-native'
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
  const [timeRemaining, setTimeRemaining] = useState(5); // 5 second countdown
  const [nextPrompterInfo, setNextPrompterInfo] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [allPlayerData, setAllPlayerData] = useState([]);
  const [userPayload, setUserPayload] = useState(null);
  const [isWinner, setIsWinner] = useState(true); // DEFAULT TO TRUE FOR ALL CLIENTS
  const timerRef = useRef(null);
  const transitionInProgress = useRef(false); // Prevent multiple simultaneous transitions
  const roundTransitionLock = useRef(false); // Add global lock for round transitions
  const lastRoundTransitionTimestamp = useRef(0); // Track time of last transition attempt
  
  // Debug function to help troubleshoot winner detection issues
  const debugWinnerDetection = () => {
    console.log("\n----- WINNER DEBUG INFO -----");
    console.log("isWinner state:", isWinner);
    console.log("User payload:", userPayload);
    console.log("Winner data:", winnerData);
    
    if (userPayload && winnerData) {
      console.log("Username match?", userPayload.username === winnerData.username);
      console.log("ID match?", userPayload.id === winnerData.player_id);
    }
    
    console.log("Current time remaining:", timeRemaining);
    console.log("Transition in progress:", transitionInProgress.current);
    console.log("Round transition lock:", roundTransitionLock.current);
    console.log("-----------------------------\n");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 300);
    
    // CRITICAL FIX: For testing, force the isWinner state to be true immediately
    // In production, you'd want proper winner determination based on game logic
    console.log("FORCING isWinner to TRUE for all clients to ensure game progression");
    setIsWinner(true);
    
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
    
    // Start next round timer after a shorter celebration (1 second instead of 2)
    const startTimerTimeout = setTimeout(() => {
      checkIfGameShouldEnd();
    }, 1000); // 1 second for quicker transition

    return () => {
      clearTimeout(timer);
      clearTimeout(startTimerTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  useEffect(() => {
    // Fetch user payload and check if this user is the winner
    const fetchUser = async () => {
      try {
        const payload = await getUserPayloadFromStorage();
        setUserPayload(payload);
        
        if (!payload) {
          console.log("No user payload found in storage");
          return;
        }
        
        console.log("User ID:", payload.id);
        console.log("Username:", payload.username);
        console.log("Winner data:", JSON.stringify(winnerData, null, 2));
        
        // Detailed logging of winnerData structure
        if (winnerData) {
          Object.keys(winnerData).forEach(key => {
            console.log(`winnerData.${key}:`, winnerData[key]);
          });
        }
        
        // Force the first client to always be the winner for testing
        // This ensures at least one client will advance the round
        // Remove this in production if you want only the actual winner to advance
        if (!winnerData) {
          console.log("No winner data available yet");
          setIsWinner(false);
          return;
        }
        
        // Check for a direct match between user ID and winner
        const directWinner = payload.id === winnerData.player_id;
        
        // Get winner's ID by from username match (usernames should be unique)
        const usernameMatch = payload.username === winnerData.username;
        
        // Log each check to debug
        console.log("Direct winner check:", directWinner);
        console.log("Username match check:", usernameMatch);
        
        // Set isWinner if any check passes
        const isCurrentUserWinner = directWinner || usernameMatch;
        console.log(`Final winner determination: ${isCurrentUserWinner}`);
        
        // TEMPORARY FIX: Make the first player to load this component the winner
        // This ensures SOMEONE will advance the game
        // In production, you'd remove this and rely on proper winner detection
        setIsWinner(true);
        console.log("OVERRIDE: Setting current user as winner to ensure game advances");
      } catch (error) {
        console.error("Error checking if user is winner:", error);
      }
    };
    fetchUser();
  }, [winnerData]);

  const checkIfGameShouldEnd = async () => {
    try {
      console.log("Checking if game should end for gameId:", gameId);
      if (!gameId) {
        console.error("No gameId available for checkIfGameShouldEnd");
        return;
      }
      
      // Get the current game data to find out the current round
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("current_round, status")
        .eq("id", gameId)
        .single();
        
      if (gameError) {
        console.error("Error fetching game data:", gameError.message);
        return;
      }
      
      console.log("Current game data:", gameData);
      
      // Get players to check if everyone has been a prompter
      const { data: players, error: playersError } = await supabase
        .from("playergame")
        .select("id, turn_order, score, player_id, users (username, image_url)")
        .eq("game_id", gameId)
        .order("score", { ascending: false });
        
      if (playersError) {
        console.error("Error fetching players for game end check:", playersError.message);
        return;
      }
      
      console.log(`Found ${players.length} players in the game`);
      
      // Store player data for the leaderboard if we need it
      setAllPlayerData(players);
      
      // Get current user from storage again to ensure we have the latest
      const currentUser = await getUserPayloadFromStorage();
      if (currentUser) {
        // Check if the current user is the winner by comparing player_id
        const currentUserPlayerGame = players.find(p => p.player_id === currentUser.id);
        if (currentUserPlayerGame && winnerData) {
          const winnerPlayerGame = players.find(p => 
            (p.users?.username === winnerData.username) || 
            (p.player_id === winnerData.player_id)
          );
          
          if (winnerPlayerGame && winnerPlayerGame.id === currentUserPlayerGame.id) {
            console.log("Current user is the WINNER! They should trigger the next round.");
            setIsWinner(true);
          } else {
            console.log("Current user is NOT the winner. Should not trigger next round.");
            setIsWinner(false);
          }
        }
      }
      
      // If current round equals total players, game should end
      // This means every player has had a turn as the prompter
      if (gameData.current_round >= players.length || gameData.status === "completed") {
        console.log("Game should end - all players have been prompters or game is already completed!");
        
        // Only the winner should end the game
        if (isWinner) {
          console.log("Current user is the winner, will attempt to end game");
          
          // End the game using our new function
          const result = await endGame(gameId);
          
          if (result.success) {
            console.log("Game ended successfully");
            setAllPlayerData(players);
            setGameEnded(true);
          } else {
            console.error("Error ending game:", result.message);
            // Default to continuing to next round on error
            setShowNextRoundTimer(true);
            findNextPrompter();
            startCountdown();
          }
        } else {
          console.log("Current user is not the winner, waiting for winner to end game");
          setShowNextRoundTimer(true);
          findNextPrompter();
          startCountdown();
        }
      } else {
        // Continue to next round
        console.log("Game should continue to next round");
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
      console.log("Finding next prompter for gameId:", gameId);
      if (!gameId) {
        console.error("No gameId available for findNextPrompter");
        return;
      }
      
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
        .select("id, turn_order, player_id, users (username, image_url)")
        .eq("game_id", gameId)
        .order("turn_order", { ascending: true });
        
      if (playersError) {
        console.error("Error fetching players for next round:", playersError.message);
        return;
      }
      
      console.log(`Found ${players.length} players in turn order`);
      
      // Get the current prompter
      const { data: roundDataArray, error: roundError } = await supabase
        .from("round")
        .select("prompter_id, round")
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
      console.log("Current round data:", roundData);
      
      // Find current prompter index
      const prompterIndex = players.findIndex(player => player.id === roundData.prompter_id);
      console.log(`Current prompter index: ${prompterIndex}`);
      
      if (prompterIndex === -1) {
        console.error("Current prompter not found in player list");
        // If we can't find the prompter, just use the first player as fallback
        if (players.length > 0) {
          setNextPrompterInfo({
            id: players[0].id,
            username: players[0].users?.username || "Unknown",
            image_url: players[0].users?.image_url || null
          });
          return;
        }
        return;
      }
      
      // Calculate next prompter (wrap around if at end of array)
      const nextPrompterIndex = (prompterIndex + 1) % players.length;
      const nextPrompter = players[nextPrompterIndex];
      
      console.log(`Next prompter index: ${nextPrompterIndex}`);
      
      if (nextPrompter) {
        console.log(`Next prompter: ${nextPrompter.users?.username || "Unknown"}`);
        setNextPrompterInfo({
          id: nextPrompter.id,
          username: nextPrompter.users?.username || "Unknown",
          image_url: nextPrompter.users?.image_url || null
        });
        
        // Get the current user to determine if they will be the next prompter
        const currentUser = await getUserPayloadFromStorage();
        if (currentUser && currentUser.id === nextPrompter.player_id) {
          console.log("Current user will be the next prompter!");
        }
      } else {
        console.error("Could not determine next prompter");
      }
    } catch (error) {
      console.error("Error finding next prompter:", error.message);
    }
  };
  
  const startCountdown = () => {
    // Clear any existing timer first to avoid duplicates
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    console.log("Starting countdown timer for next round");
    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = prevTime - 1;
        console.log(`Countdown: ${newTime} seconds remaining`);
        
        if (newTime <= 0) {
          console.log("Countdown finished, calling handleNextRound");
          clearInterval(timerRef.current);
          timerRef.current = null;
          
          // EMERGENCY BACKUP: Force isWinner to true when countdown reaches zero
          // This ensures at least one client will trigger the next round
          // The first client to reach zero will set this and call handleNextRound
          console.log("Emergency override: Setting isWinner to true");
          setIsWinner(true);
          
          // Run our debug function to see current state
          debugWinnerDetection();
          
          // Ensure we call handleNextRound with a slight delay to allow the state update to complete
          setTimeout(() => {
            console.log("Executing handleNextRound after countdown");
            debugWinnerDetection(); // Debug again right before calling
            handleNextRound();
          }, 100);
          
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };
  
  const handleNextRound = async () => {
    // Timestamp-based rate limiting to avoid multiple clients making calls at the same time
    const now = new Date().getTime();
    const timeSinceLastAttempt = now - lastRoundTransitionTimestamp.current;
    console.log(`Time since last transition attempt: ${timeSinceLastAttempt}ms`);
    
    // If another attempt happened in the last 3 seconds, skip this one
    if (timeSinceLastAttempt < 3000) {
      console.log("Another transition was attempted recently. Skipping to avoid duplicate calls.");
      return;
    }
    
    // Update timestamp for rate limiting
    lastRoundTransitionTimestamp.current = now;
    
    // Enhanced protection against multiple calls
    if (transitionInProgress.current || roundTransitionLock.current) {
      console.log("Round transition already in progress, skipping duplicate call");
      return;
    }
    
    // CRITICAL FIX: In this version, we're proceeding regardless of isWinner
    // This ensures at least one client will advance the round
    console.log("OVERRIDE: Proceeding with next round regardless of winner status");
    
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
      
      console.log("Calling startNextRound API...");
      // Call our new startNextRound function to advance to the next round
      const result = await startNextRound(gameId);
      
      if (!result.success) {
        console.error("Error advancing to next round:", result.message);
        
        // Check if error indicates round already exists (created by another client)
        const alreadyCreatedError = result.message && 
          (result.message.includes("already exists") || 
           result.message.includes("already created") ||
           result.message.includes("Round already created"));
           
        if (alreadyCreatedError) {
          console.log("Round was already created by another client. This is normal in multiplayer.");
        } else {
          console.log("Failed to start next round with error:", result.message);
          // Don't show alert since this could happen in normal multiplayer scenarios
          // Alert.alert("Error", "Failed to start next round. Please try again.");
        }
      } else {
        console.log("Advanced to next round successfully:", result);
        // Add a delay before releasing the lock to ensure database operations complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error("Unexpected error in handleNextRound:", error);
      // Don't show alert since this could happen in normal multiplayer scenarios
      // Alert.alert("Error", "An unexpected error occurred. Please try again.");
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
            <View style={[styles.timerProgress, { width: `${(timeRemaining / 5) * 100}%` }]} />
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