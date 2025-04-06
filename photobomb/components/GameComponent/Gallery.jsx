import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Animated, ScrollView, Modal } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { getSupabaseUrl } from '../../service/imageService';
import Loading from '../Loading';
import Button from '../Button';
import { getSubmissionData, getPlayerGame, updateUserScore } from '../../service/gameService';



// ...existing imports...

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
            }, 5000);
    
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
        const currentImage = imageUrlList[currentImageIndex];
        console.log(currentImage);
        console.log('Current image URI:', currentImage.photo_uri);

        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Users Submissions</Text>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={[styles.singleImageWrapper, { opacity: fadeAnim }]}>
                        <Image
                            key={currentImageIndex}
                            source={{ uri: getSupabaseUrl(currentImage.photo_uri) }}
                            style={styles.singleImage}
                            resizeMode="contain"
                            onError={(error) => console.log('Image loading error:', error.nativeEvent)}
                            onLoad={() => console.log('Image loaded successfully for URI:', currentImage.photo_uri)}
                        />
                    </Animated.View>
                </ScrollView>
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
    container: {
        flex: 1,
        backgroundColor: '#121212',
        paddingVertical: 0,
    },
    scrollContent: {
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 24,
        color: '#ffffff',
        textAlign: 'center',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    image: {
        width: 150,
        height: 150,
        borderRadius: 20,
        padding: 5,
    },
    singleImageWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    singleImage: {
        width: '100%',
        height: 400,
        aspectRatio: 1,
    },
    description: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
    },
    imageWrapper: {
        marginBottom: 15,
        alignItems: 'center',
        borderRadius: 15,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalText: {
        marginBottom: 10,
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectedImage: {
        width: 275,
        height: 275,
        marginBottom: 20,
        borderRadius: 10,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});