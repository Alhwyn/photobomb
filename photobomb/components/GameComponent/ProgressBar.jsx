import { Animated, StyleSheet, View } from 'react-native';
import React, { useEffect, useRef } from 'react';

const ProgressBar = ({ duration = 5000, color = 'purple' }) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 1,
            duration,
            useNativeDriver: false, // Consider changing to `true` and use scaling
        }).start();
    }, [progress, duration]);

    return (
        <View style={styles.progressBarContainer}>
            <Animated.View
                style={[
                    styles.progressBar,
                    {
                        width: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
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
        width: '80%',
        height: 10,
        backgroundColor: '#d3d3d3',
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 20,
    },
    progressBar: {
        height: '100%',
    },
});