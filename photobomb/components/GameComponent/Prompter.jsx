import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import PromptCard from './PromptCard'
import { supabase } from '../../lib/supabase';

const Prompter = () => {

    const [prompts, setPrompts] = useState([]);
    const [selectedPromptId, setSelectedPromptId] = useState(null);

    const handlePromptSelection = (promptId) => {
        setSelectedPromptId(promptId);
    }

    const fetchRandomPrompts = async () => {
        try {
            const { data, error } = await supabase
                .from('prompts')
                .select('*')
                .order('id', { ascending: false })
                .limit(5);

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
                    onSelect={() => handlePromptSelection(item.id)}
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