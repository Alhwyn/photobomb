import { StyleSheet, TextInput, View, Animated } from 'react-native';
import React, { useState, useRef } from 'react';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';

const NumberInput = (props) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedBorder = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedBorder, {
      toValue: 1, // End value for the animation
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedBorder, {
      toValue: 0, // Reset animation to initial value
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = animatedBorder.interpolate({
    inputRange: [0, 1],
    outputRange: ['white', '#8A2BE2'], // Default color to purple gradient color
    borderWidth: 10
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: borderColor, borderWidth: isFocused ? 2 : 0.4 },
        props.containerStyle && props.containerStyle,
      ]}
    >
      {props.icon && props.icon}
      <TextInput
        style={[
            { flex: 1, color: 'white', textAlign: 'center', fontWeight: theme.fonts.extraBold }, // Center-align the text
        ]}
        placeholder="Enter 6-digit PIN"
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef && props.inputRef}
        keyboardType="numeric" // Restrict to numeric keyboard
        maxLength={6} // Limit input to 6 characters
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Animated.View>
  );
};

export default NumberInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2, // Default border width
    borderColor: 'white', // Default border color
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    gap: 12,
  },
});
