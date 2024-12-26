import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';

const Gallery = () => {
    const images = {
        image1: { 
            uri: require('../../assets/images/mode1.png'), 
            description: 'Local Image 1' 
        },
        image2: { 
            uri: require('../../assets/images/mode2.png'), 
            description: 'Local Image 2' 
        },
        image3: { 
            uri: require('../../assets/images/mode3.png'), 
            description: 'Local Image 3' 
        },
        image4: { 
            uri: require('../../assets/images/mode4.png'), 
            description: 'Local Image 4' 
        }
    };

    const imageKeys = Object.keys(images);
    const totalImages = imageKeys.length;



    const handleImagePress = (index) => {
        console.log('Image pressed at index: ', index);
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Select an image</Text>
            <View style={styles.imageGrid}>
                {Object.keys(images).map((key, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.imageWrapper}
                        onPress={() => handleImagePress(index)}
                    >
                        <Image source={images[key].uri} style={styles.image}/>
                        <Text style={styles.description}>{images[key].description}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
}

export default Gallery;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: '#121212',
        paddingVertical: 20,
    },
    title: {
        fontSize: 24,
        color: '#ffffff',
        marginBottom: 20,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    imageWrapper: {
        marginBottom: 15,
        width: '30%',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 10,
    },
    description: {
        color: '#ccc',
        marginTop: 5,
        fontSize: 14,
        textAlign: 'center',
    },
});