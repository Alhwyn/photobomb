import { Animated, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

const ProgressBar = ({ duration = 5000, color = 'purple' }) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loopAnimation = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration,
                useNativeDriver: false, // Consider changing to `true` and use scaling
            }),
            {
                resetBeforeIteration: true, // Reset value before each iteration
            }
        );

        loopAnimation.start();

        return () => loopAnimation.stop(); // Cleanup the animation on unmount
    }, [progress, duration]);

    return (
        <View style={styles.progressBarContainer}>
            <Animated.View
                style={[
                    styles.progressBar,
                    {
                        width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['100%', '0%'], // Corrected the direction
                        }),
                        backgroundColor: color, // Dynamic color
                    },
                ]}
            />
        </View>
    );
};

export default ProgressBar;

const styles = StyleSheet.create({
    progressBarContainer: {
        width: '100%',
        height: 5,
        backgroundColor: '#d3d3d3',
        overflow: 'hidden',
        marginTop: 20,
    },
    progressBar: {
        height: '100%',
    },
});