import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const PromptCard = ({ text, author="PhotoBomb", media}) => {
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
        width: 300,
        height: 425,
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
        marginTop: 20,
        marginLeft: 30,
        alignItems: 'flex-start',
    },
    promptText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    authorText: {
        fontSize: 14,
        color: '#555',
        fontStyle: 'italic',
    },
});