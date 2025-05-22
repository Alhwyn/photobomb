import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient';

const PromptCard = ({ text, author="PhotoBomb", isSelected, onSelect, delay = 0 }) => {

  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
        delay,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSelect = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    console.log('PromptCard selected: ', text);
    onSelect();
  };

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }], opacity }}>
      <TouchableOpacity onPress={handleSelect} activeOpacity={0.85}>
        <LinearGradient
          colors={isSelected ? ['#8B5CF6', '#EC4899'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, isSelected && styles.selectedCard]}
        >
          <View style={styles.content}>
            <Text style={[styles.promptText, isSelected && styles.selectedText]}>
              {text}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PromptCard

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#f1f1f1',
  },
  selectedText: {
    color: '#fff',
  },
  selectedCard: {
    shadowColor: '#6ea8ff',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});