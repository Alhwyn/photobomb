import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Animated, ScrollView } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { getSupabaseUrl } from '../../service/imageService';

const Gallery = () => {
    const [showAllImages, setShowAllImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const images = [
        { uri: require('../../assets/images/mode1.png'), description: 'Local Image 1' },
        { uri: require('../../assets/images/mode2.png'), description: 'Local Image 2' },
        { uri: require('../../assets/images/mode3.png'), description: 'Local Image 3' },
        { uri: require('../../assets/images/mode4.png'), description: 'Local Image 4' },
    ];

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
        console.log('showAllImages:', showAllImages);
        if (!showAllImages) {
            fadeIn();
            const timer = setInterval(() => {
                fadeOut();
                setTimeout(() => {
                    setCurrentImageIndex((prev) => {
                        if (prev === images.length - 1) {
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

    const renderSingleImage = () => {
        const currentImage = images[currentImageIndex];
        console.log('Current image URI:', currentImage.uri);
        console.log('Current image description:', currentImage.description);

        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}> Users Submissions</Text>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Animated.View style={[styles.singleImageWrapper, { opacity: fadeAnim }]}>

                        {/* Original image */}
                        <Image
                            key={currentImageIndex}
                            source={currentImage.uri}
                            style={styles.singleImage}
                            resizeMode="contain"
                            onError={(error) => console.log('Image loading error:', error.nativeEvent)}
                            onLoad={() => console.log('Image loaded successfully for URI:', currentImage.uri)}
                        />
                        <Text style={styles.description}>{currentImage.description}</Text>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        );
    };

    if (!showAllImages) {
        return renderSingleImage();
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Select the best submission</Text>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageGrid}>
                    {images.map((image, index) => (
                        <TouchableOpacity
                        key={index}
                        style={styles.imageWrapper}
                        onPress={() => console.log('Image pressed:', index)}
                        >
                            <Image
                                source={image.uri}
                                style={styles.image}
                                onError={(error) => console.log('Image loading error:', error.nativeEvent)}
                                onLoad={() => console.log('Image loaded successfully for URI:', image.uri)}
                            />
                            <Text style={styles.description}>{image.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
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
});