import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import PromptCard from './PromptCard'
import { supabase } from '../../lib/supabase';

const Prompter = ({ onPromptSelect }) => {

    const [prompts, setPrompts] = useState([]);
    const [selectedPromptId, setSelectedPromptId] = useState(null);

    const handlePromptSelection = (promptId, promptText) => {
        setSelectedPromptId(promptId);
        const promptData = { id: promptId, text: promptText };

        console.log('Selected prompt in Prompter:', promptData);

        if (typeof onPromptSelect === 'function') {
            onPromptSelect(promptData);
        } else {
            console.error('onPromptSelect is not a function');
        }
    };

    const fetchRandomPrompts = async () => {
        try {

            const { data, error } = await supabase
                .rpc('get_random_prompts', { limit_count: 5 }); // Pass the limit as a parameter

            
            if (error) {
                console.error('Something went wrong with fetching prompts: ', error.message);
                return;
            }

            setPrompts(data);
        } catch (error) {
            console.error('Error in fetchRandomPrompts: ', error.message);
        }
    };

    useEffect(() => {
        fetchRandomPrompts();
    }, []);


  return (
    <View stlye={styles.container}>
        <FlatList
            data={prompts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <PromptCard 
                    text={item.text} 
                    author={item.author} 
                    isSelected={selectedPromptId === item.id}
                    onSelect={() => handlePromptSelection(item.id, item.text)}
                />
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
        paddingHorizontal: 5,
        gap: 5,
    }
})