import { FlatList, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import PromptCard from './PromptCard'

const Prompter = () => {

    const prompts = [
        { id: '1', text: 'Show the funniest meme in your photo gallery.', author: 'Alice' },
        { id: '2', text: 'Share a picture of your last vacation.', author: 'Bob' },
        { id: '3', text: 'What’s the weirdest screenshot you have?', author: 'Charlie' },
        { id: '4', text: 'Find a photo that perfectly represents your mood right now.', author: 'Diana' },
        { id: '5', text: 'Post the most delicious food picture you’ve taken.', author: 'Eve' }
    ];

  return (
    <View stlye={styles.container}>
        <FlatList
            data={prompts}
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
        gap: 4,
    }
})