import { StyleSheet, Text, View, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import ProgressBar from './ProgressBar';

const PromptSelection = () => {

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
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % imageKeys.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [imageKeys]);

    const currentImage = images[imageKeys[currentIndex]];
        
  return (
    <View stlye={styles.container}>
        <Image source={currentImage.uri} style={styles.image} />
        <Text style={styles.description}>{currentImage.description}</Text>
        <ProgressBar duration={5000}/>



    </View>
  )
}

export default PromptSelection

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'cneter',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    image: {
        width: 300,
        height: 300,
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});