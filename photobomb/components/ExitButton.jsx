import { StyleSheet, Text, Pressable, Alert } from 'react-native';
import React from 'react';
import Icon from '../assets/icons'; // Ensure this import points to a valid Icon component
import { theme } from '../constants/theme';
import { router } from 'expo-router';

const ExitButton = ({ size = 26 }) => {
    const handleExit = () => {
        Alert.alert(
            'Exit Lobby',
            'Are you sure you want to leave the lobby?',
            [
                { text: 'Cancel', style: 'cancel' }, // User cancels exit
                {
                    text: 'Exit',
                    onPress: () => {
                        router.back(); // Navigate back to the previous screen
                    },
                    style: 'destructive'
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <Pressable onPress={handleExit} style={styles.button}>
            <Icon name="Exit" strokeWidth={2.5} size={size} color={theme.colors.text} />
        </Pressable>
    );
};

export default ExitButton;

const styles = StyleSheet.create({
    button: {
        alignSelf: 'flex-start',
        padding: 10,
        borderRadius: theme.radius.sm,
        backgroundColor: 'rgba(0,0,0,0.07)',
        marginLeft: 20,
    },
});