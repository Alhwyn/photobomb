import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Animated, ScrollView, Modal } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { getSupabaseUrl } from '../../service/imageService';
import Loading from '../Loading';
import Button from '../Button';
import { getSubmissionData, getPlayerGame, updateUserScore } from '../../service/gameService';
import { BlurView } from 'expo-blur';


const Gallery = ({ gameId }) => {
    const [showAllImages, setShowAllImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true); 
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [imageUrlList, setImageUrlList] = useState(null);
    const [isPrompter, setIsPrompter] = useState(false);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);

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
            
            console.log('getImageListPayload: 1', getImageListPayload);
            console.log('getImageListPayload: 2', getImageListPayload.data);
            
            setImageUrlList(getImageListPayload.data);
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
                        console.log('Current image index, imageUrlList:', imageUrlList);
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

        console.log('Selected image URI:', selectedImageUri);
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
                            <Image
                                key={currentImageIndex}
                                source={{ uri: imageUri }}
                                style={styles.singleImage}
                                resizeMode="contain"
                                onError={(error) => console.log('Image loading error:', error.nativeEvent)}
                            />
                        </Animated.View>
                    </View>
                </View>
            </SafeAreaView>
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
            <Text style={styles.title}>Select the best submission</Text>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageGrid}>
                    {imageUrlList.map((image, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.imageWrapper}
                            onPress={() => getIMageUrlFromIndex(index)}
                        >
                            <Image
                                source={{ uri: getSupabaseUrl(image.photo_uri) }}
                                style={styles.image}
                                onError={(error) => console.log('Image loading error:', error.nativeEvent)}
                                onLoad={() => console.log('Image loaded successfully for URI:', image.photo_uri)}
                            />
                            <Text style={styles.description}>{image.description}</Text>
                        </TouchableOpacity>
                    ))}
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
                            <Image source={{ uri: selectedImageUri }} style={styles.selectedImage} />
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
        zIndex: 1, // Ensure the blur is under the content
    },
    blurredBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.7,
        resizeMode: 'cover', 
    },
    container: {
        backgroundColor: '#121212',
        flex: 1,
    },
    contentLayer: {
        position: '',
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
    },
    image: {
        borderRadius: 20,
        height: 150,
        padding: 5,
        width: 150,
    },
    imageBackgroundContainer: {
        flex: 1,
        width: 500,
        height: 1000,
        maxWidth: '100%',
        maxHeight: '100%',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    imageWrapper: {
        alignItems: 'center',
        borderRadius: 15,
        marginBottom: 15,
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
    },
});