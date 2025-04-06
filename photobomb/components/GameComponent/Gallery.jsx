import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Animated, ScrollView, Modal, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { getSupabaseUrl } from '../../service/imageService';
import Loading from '../Loading';
import Button from '../Button';
import { LinearGradient } from 'expo-linear-gradient'
import { getSubmissionData, getPlayerGame, updateUserScore } from '../../service/gameService';
import * as FileSystem from 'expo-file-system';


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

    // Function to preload all images in the gallery
    const preloadImages = async (images) => {
      if (!images) return;
      
      const uris = images.map(image => getSupabaseUrl(image.photo_uri));
      
      // Initialize loading states for all images
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

    const confirmImageSelection = async () => {
        const selectedImagePayload = imageUrlList[currentImageIndex];
        const currentPlayerSore = await getPlayerGame(selectedImagePayload.player_id);
        const checkScoreUpdate = await updateUserScore(selectedImagePayload.player_id, selectedImagePayload.game_id, currentPlayerSore.data.score);
        setIsModalVisible(false);
        setImagesSelected(true);
    };

    useEffect(() => {
        const fetchImageList = async () => {
            setLoading(true);  
            const getImageListPayload = await getSubmissionData(gameId);
            
            if (!getImageListPayload.success) {
                console.log('Error fetching image list');
                setLoading(false);
                return;
            }
            
            setImageUrlList(getImageListPayload.data);
            
            await preloadImages(getImageListPayload.data);
            setLoading(false); 
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
        const currentImagePayload = imageUrlList[index];
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
        const imageUri = getSupabaseUrl(image.photo_uri);
        const isLoading = loadingStates[imageUri];
        
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
                <Text style={styles.description}>{image.description}</Text>
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