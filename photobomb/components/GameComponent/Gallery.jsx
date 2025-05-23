import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Animated, ScrollView, Modal, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { getSupabaseUrl } from '../../service/imageService';
import Loading from '../Loading';
import Button from '../Button';
import { LinearGradient } from 'expo-linear-gradient'
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../lib/supabase';
import Winner from './Winner';


const imageCache = {};


const preloadImage = async (uri) => {
  if (imageCache[uri]) return;
  
  try {

    if (uri.startsWith('http')) {

      const fileUri = FileSystem.cacheDirectory + uri.split('/').pop();
      const { uri: localUri } = await FileSystem.downloadAsync(uri, fileUri);
      imageCache[uri] = localUri;
    } else {

      imageCache[uri] = uri;
    }
  } catch (error) {
    console.log('Image preloading error:', error);
  }
};

const Gallery = ({ gameId, currentPrompt, prompter }) => {
    const [showAllImages, setShowAllImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true); 
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [imageUrlList, setImageUrlList] = useState(null);
    const [loadingStates, setLoadingStates] = useState({});

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [winnerSelected, setWinnerSelected] = useState(false);
    const [winnerData, setWinnerData] = useState(null);
    
    const preloadImages = async (images) => {
      if (!images) return;
      
      const uris = images.map(image => getSupabaseUrl(image.photo_uri));
      
      const initialLoadingStates = {};
      uris.forEach(uri => {
        initialLoadingStates[uri] = true;
      });
      setLoadingStates(initialLoadingStates);
      
      // Preload images one by one
      for (const uri of uris) {
        await preloadImage(uri);
        // Update loading state for this image
        setLoadingStates(prev => ({
          ...prev,
          [uri]: false
        }));
      }
    };

    // Handle image load success
    const handleImageLoaded = (uri) => {
      setLoadingStates(prev => ({
        ...prev,
        [uri]: false
      }));
    };

    const fadeOut = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const fadeIn = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    };

    const cancelImageSelection = () => {
        setIsModalVisible(false);
        setSelectedImageUri(null);
    };

    // Enhanced helper function with better validation and error handling
    const prepareWinnerData = (submission) => {
        // Log detailed information about the submission to help diagnose issues
        console.log('Preparing winner data from submission:', {
            id: submission?.id,
            player_id: submission?.player_id,
            hasPlayergame: !!submission?.playergame,
            hasUserData: !!(submission?.playergame?.users),
            round_id: submission?.round_id
        });
        
        if (!submission) {
            console.error('Invalid submission: submission is null or undefined');
            return null;
        }
        
        if (!submission.player_id) {
            console.error('Invalid submission: missing player_id');
            return null;
        }
        
        if (!submission.photo_uri) {
            console.error('Invalid submission: missing photo_uri');
            return null;
        }
        
        // If playergame or user data is missing, we'll use fallback values
        const username = submission.playergame?.users?.username || 'Winner';
        const image_url = submission.playergame?.users?.image_url || null;
        
        return {
            username,
            image_url,
            photo_uri: submission.photo_uri,
            player_id: submission.player_id,
            round_id: submission.round_id
        };
    };

    const confirmImageSelection = async () => {
        try {
            // Get the selected image data
            const selectedImagePayload = imageUrlList[currentImageIndex];
            
            if (!selectedImagePayload) {
                console.error('No image selected or index is invalid');
                setIsModalVisible(false);
                return;
            }
            
            console.log('Selected image payload:', selectedImagePayload);
            
            // Get the player's current score from playergame table
            const { data: playerData, error: playerError } = await supabase
                .from('playergame')
                .select('*')
                .eq('id', selectedImagePayload.player_id)
                .single();
                
            if (playerError) {
                console.error('Error fetching player data:', playerError.message);
                setIsModalVisible(false);
                return;
            }
            
            console.log('Player data for winner:', playerData);
            
            // Increment the player's score
            const currentScore = playerData.score || 0;
            const { error: updateError } = await supabase
                .from('playergame')
                .update({ score: currentScore + 1 })
                .eq('id', selectedImagePayload.player_id);
                
            if (updateError) {
                console.error('Error updating player score:', updateError.message);
                setIsModalVisible(false);
                return;
            }
            
            console.log('Successfully updated player score for winner');
            
            // Use our helper function to ensure winner data is properly set
            const winnerData = prepareWinnerData(selectedImagePayload);
            if (winnerData) {
                console.log('Winner data prepared successfully:', winnerData);
                setWinnerData(winnerData);
                setWinnerSelected(true);
            } else {
                console.error('Failed to prepare winner data, trying fallback approach');
                
                // Fallback: Create minimal winner data if we have the essential info
                if (selectedImagePayload.photo_uri && selectedImagePayload.player_id) {
                    const fallbackWinnerData = {
                        username: 'Winner',
                        image_url: null,
                        photo_uri: selectedImagePayload.photo_uri,
                        player_id: selectedImagePayload.player_id,
                        round_id: selectedImagePayload.round_id
                    };
                    
                    console.log('Using fallback winner data:', fallbackWinnerData);
                    setWinnerData(fallbackWinnerData);
                    setWinnerSelected(true);
                } else {
                    console.error('Cannot create even fallback winner data');
                }
            }
            
            setIsModalVisible(false);
        } catch (error) {
            console.error('Error in confirmImageSelection:', error.message);
            setIsModalVisible(false);
        }
    };

    useEffect(() => {
        const fetchImageList = async () => {
            setLoading(true);  
            try {
                // First, get the current round for this game
                const { data: roundDataArray, error: roundError } = await supabase
                    .from('round')
                    .select('id, round')
                    .eq('game_id', gameId)
                    .order('round', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (roundError) {
                    console.error('Error fetching current round:', roundError.message);
                    setLoading(false);
                    return;
                }
                
                if (!roundDataArray || roundDataArray.length === 0) {
                    console.error('No round data found for this game');
                    setLoading(false);
                    return;
                }
                
                const roundData = roundDataArray[0];
                console.log('Current round info for fetching submissions:', roundData);

                // Now use the round_id to filter submissions
                const { data, error } = await supabase
                    .from('submissions')
                    .select(`
                        *,
                        playergame (
                            id,
                            player_id,
                            score,
                            users (
                                username,
                                image_url
                            )
                        )
                    `)
                    .eq('game_id', gameId)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching submissions:', error.message);
                    setLoading(false);
                    return;
                }

                console.log('Fetched submissions with user data:', data);
                
                // Filter out submissions without photos and validate data integrity
                const validSubmissions = data.filter(submission => {
                    // Must have a photo and player data
                    return submission.photo_uri && 
                           submission.player_id && 
                           submission.playergame &&
                           submission.playergame.users;
                });
                
                console.log('Valid submissions for display:', validSubmissions.length);
                
                setImageUrlList(validSubmissions);
                await preloadImages(validSubmissions);
                setLoading(false);
            } catch (error) {
                console.error('Error in fetchImageList:', error.message);
                setLoading(false);
            }
        };
    
        fetchImageList();
    }, [gameId]);
    
    useEffect(() => {
        if (imageUrlList && !showAllImages) {
            fadeIn();
            const timer = setInterval(() => {
                fadeOut();
                setTimeout(() => {
                    setCurrentImageIndex((prev) => {
                        const nextIndex = (prev + 1) % imageUrlList.length;
                        
                        if (nextIndex === 0 && prev > 0) {
                            setShowAllImages(true);
                            return prev;
                        }
                        
                        fadeIn();
                        return nextIndex;
                    });
                }, 500);
            }, 3000);
    
            return () => clearInterval(timer);
        }
    }, [imageUrlList, showAllImages]);

    const getIMageUrlFromIndex = (index) => {
        if (!imageUrlList || !imageUrlList[index] || !imageUrlList[index].photo_uri) {
            console.error('Invalid image index or no images available');
            return;
        }
        setCurrentImageIndex(index);  // Set the current index for use in confirmImageSelection
        const currentImagePayload = imageUrlList[index];
        
        // Verify we have all required data
        if (!currentImagePayload.player_id) {
            console.error('Selected image has no player_id');
            return;
        }
        
        setSelectedImageUri(getSupabaseUrl(currentImagePayload.photo_uri));
        setIsModalVisible(true);
    }

    const renderSingleImage = () => {
        if (!imageUrlList || !imageUrlList[currentImageIndex]) {
            return (
                <SafeAreaView style={styles.container}>
                    <Loading />
                </SafeAreaView>
            );
        }
        const currentImage = imageUrlList[currentImageIndex];
        const imageUri = getSupabaseUrl(currentImage.photo_uri);
        const isLoading = loadingStates[imageUri];

        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.imageBackgroundContainer}>
                    {/* Background blur layer */}
                    <Image 
                        source={{ uri: imageUri }}
                        style={styles.blurredBackground}
                        blurRadius={20}
                    />
                    {/* Main image on top */}
                    <View style={styles.mainImageContainer}>
                        <Animated.View style={[{ opacity: fadeAnim }]}>
                            {isLoading && (
                                <ActivityIndicator size="large" color="#ffffff" style={styles.imageLoader} />
                            )}
                            <Image
                                key={currentImageIndex}
                                source={{ uri: imageUri }}
                                style={[styles.singleImage, isLoading && styles.hiddenImage]}
                                resizeMode="contain"
                                onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
                                onLoad={() => handleImageLoaded(imageUri)}
                            />
                        </Animated.View>
                    </View>
                </View>
            </SafeAreaView>
        );
    };

    // Render grid of images with loading indicators
    const renderGridImage = (image, index) => {
        if (!image || !image.photo_uri) {
            return null;
        }
        
        const imageUri = getSupabaseUrl(image.photo_uri);
        const isLoading = loadingStates[imageUri];
        const playerName = image.playergame?.users?.username || 'Player';
        
        return (
            <TouchableOpacity
                key={index}
                style={[
                    styles.imageWrapper, 
                    !prompter && styles.disabledImageWrapper
                ]}
                onPress={() => prompter ? getIMageUrlFromIndex(index) : null}
                disabled={!prompter || isLoading}
            >
                <View style={styles.imageContainer}>
                    {isLoading && (
                        <ActivityIndicator 
                            size="small" 
                            color="#ffffff" 
                            style={styles.gridImageLoader} 
                        />
                    )}
                    <Image
                        source={{ uri: imageUri }}
                        style={[styles.image, isLoading && styles.fadedImage]}
                        onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
                        onLoad={() => handleImageLoaded(imageUri)}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Loading />
            </SafeAreaView>
        );
    }

    if (winnerSelected) {
        // Display winner component with the selected winner
        return (
            <Winner
                winnerData={winnerData}
                currentPrompt={currentPrompt}
                gameId={gameId}
            />
        );
    }

    if (!showAllImages) {
        return renderSingleImage();
    }

    return (
        <SafeAreaView style={styles.container}>
            {prompter && (
            <Text style={styles.title}>Select the best submission</Text>
            )}
            {!prompter && (
                <Text style={styles.title}>View submissions</Text>
            )}
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageGrid}>
                    {imageUrlList.map((image, index) => renderGridImage(image, index))}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>Confirm your photo selection</Text>
                        {selectedImageUri && (
                            <View style={styles.selectedImageContainer}>
                                {loadingStates[selectedImageUri] && (
                                    <ActivityIndicator size="large" color="#000000" style={styles.modalImageLoader} />
                                )}
                                <Image 
                                    source={{ uri: selectedImageUri }} 
                                    style={styles.selectedImage} 
                                    onLoad={() => handleImageLoaded(selectedImageUri)}
                                />
                            </View>
                        )}
                        <View style={styles.modalButtons}>
                            <Button title="Cancel" onPress={cancelImageSelection} />
                            <Button title="Confirm" onPress={confirmImageSelection} />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default Gallery;

const styles = StyleSheet.create({
    blurOverlay: {
        zIndex: 1, 
    },
    blurredBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.7,
        resizeMode: 'cover', 
    },
    card: {
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    container: {
        backgroundColor: '#121212',
        flex: 1,
    },
    content: {
        margin: 15,
    },
    contentLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2, 
        width: '100%',
        height: '100%',
    },
    description: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
    },
    disabledImageWrapper: {
        opacity: 0.7,
    },
    fadedImage: {
        opacity: 0.3,
    },
    gridImageLoader: {
        position: 'absolute',
        zIndex: 5,
    },
    hiddenImage: {
        opacity: 0,
    },
    image: {
        borderRadius: 20,
        height: 150,
        padding: 5,
        width: 150,
    },
    imageBackgroundContainer: {
        flex: 1,
        position: 'relative',
        width: 500,
        height: 1000,
        maxWidth: '100%',
        maxHeight: '100%',
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
        width: 150,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    imageLoader: {
        position: 'absolute',
        zIndex: 5,
        alignSelf: 'center',
    },
    imageWrapper: {
        alignItems: 'center',
        borderRadius: 15,
        marginBottom: 15,
        width: '45%',
    },
    mainImageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10, 
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalContainer: {
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        justifyContent: 'center',
    },
    modalContent: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: 300,
    },
    modalImageLoader: {
        position: 'absolute',
        zIndex: 5,
    },
    modalText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    scrollContent: {
        alignItems: 'center',
        flex: 1,
    },
    selectedImage: {
        borderRadius: 10,
        height: 275,
        marginBottom: 20,
        width: 275,
    },
    selectedImageContainer: {
        height: 275,
        width: 275,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    singleImage: {
        width: 700, 
        height: 700, 
        maxWidth: '100%', 
        resizeMode: 'contain',
    },
    singleImageWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        paddingHorizontal: 20,
    },
    title: {
        color: '#ffffff',
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
        marginVertical: 10,
    },
    promptText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    }
});
