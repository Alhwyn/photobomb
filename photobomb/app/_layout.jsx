import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';

const _layout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Keeps the header hidden for all screens
      }}
    >
      {/* Disable gesture for Lobby screen */}
      <Stack.Screen
        name="Lobby"
        options={{
          gestureEnabled: false, // Disables swipe gestures for this screen
        }}
      />
    </Stack>
  );
};

export default _layout;

