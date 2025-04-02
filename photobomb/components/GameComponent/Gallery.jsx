import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Animated, ScrollView, Modal } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { getSupabaseUrl } from '../../service/imageService';
import Loading from '../Loading';
import { getSubmissionData } from '../../service/gameService';

// ...existing imports...

const Gallery = ({ gameId }) => {
    const [showAllImages, setShowAllImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true); 
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [imageUrlList, setImageUrlList] = useState(null);

    const [isModalVisible, setIsModalVisible] = useState(false);

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

    useEffect(() => {
        const fetchImageList = async () => {
            setLoading(true);  
            const getImageListPayload = await getSubmissionDataRetrieve(gameId);

            console.log('getImageListPayload:', getImageListPayload);

            if (!getImageListPayload) {
                console.error('Error fetching image list');
                setLoading(false);
                return;
            }

            setImageUrlList(getImageListPayload);
            setLoading(false); 
        };

        fetchImageList();

        if (!showAllImages) {
            fadeIn();
            const timer = setInterval(() => {
                fadeOut();
                setTimeout(() => {
                    setCurrentImageIndex((prev) => {

                        if (!imageUrlList || imageUrlList.length === 0) {
                            setShowAllImages(true);
                            return prev;
                        }
                        const nextIndex = prev + 1;
                        fadeIn();
                        return nextIndex;
                    });
                }, 500);
            }, 5000);

            return () => clearInterval(timer);
        }
    }, [showAllImages]);

    const getSubmissionDataRetrieve = async (game_id) => {
        try {
            const getSubmissionDataResponse = await getSubmissionData(game_id);

            if (!getSubmissionDataResponse.success) {
                console.error('Error fetching submission data:', getSubmissionDataResponse.error);
                return;
            }

            return getSubmissionDataResponse.data;
        } catch (error) {
            console.error('Error fetching submission data:', error);
        }
    };

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
                            onPress={() => console.log('Image pressed:', r)}
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
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        color: '#ffffff',
        textAlign: 'center',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around'
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 20,
    },
    singleImageWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', 
        maxHeight: 500, 
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
        width: '30%',
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
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});