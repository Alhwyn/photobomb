import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import PromptCard from './PromptCard'

const Prompter = () => {


    const prompts = [
        { id: '1', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '2', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '3', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '4', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '5', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '6', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '7', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '8', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '9', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
        { id: '10', text: 'What’s the most embarrassing photo on your phone?', author: 'Alice' },
    ]



  return (
    <View stlye={styles.container}>
        <FlatList
            data={prompts}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <PromptCard text={item.text} author={item.author} />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.list}
        />
    </View>
  );
};

export default Prompter

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '',
        justifyContent: 'center',
        alignItems: 'cneter',
    },
    list: {
        paddingHorizontal: 10,
    }
})