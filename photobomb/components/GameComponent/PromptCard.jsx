import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const PromptCard = ({ text, author="PhotoBomb"}) => {
  return (
    <View style={styles.card}>
        <View style={styles.content}>
            <Text style={styles.promptText}>{text}</Text>
            <Text style={styles.authorText}>@{author}</Text>
        </View>
    </View>
  );
};

export default PromptCard

const styles = StyleSheet.create({
    card: {
        width: 250,
        height: 325,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    content: {
        alignItems: 'flex-start',
    },
    promptText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    authorText: {
        fontSize: 14,
        color: '#555',
        fontStyle: 'italic',
    },
});