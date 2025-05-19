import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

const _layout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false, 
      }}
    >
      {/* Disable back gesture for these game-related screens */}
      <Stack.Screen
        name="Lobby"
        options={{
          gestureEnabled: false, 
        }}
      />
      <Stack.Screen
        name="games/MainGame"
        options={{
          gestureEnabled: false, 
        }}
      />
      <Stack.Screen
        name="games/LeaderBoard"
        options={{
          gestureEnabled: false, 
        }}
      />
      <Stack.Screen
        name="gameSelector"
        options={{
          gestureEnabled: false, 
        }}
      />
      <Stack.Screen
        name="joinGame"
        options={{
          gestureEnabled: false, 
        }}
      />
    </Stack>
  );
};

export default _layout;

