import { StyleSheet, TextInput, View, Animated } from 'react-native';
import React, { useState, useRef } from 'react';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';

const Input = (props) => {
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
    outputRange: [theme.colors.text, '#8A2BE2'], // Default color to purple gradient color
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
        style={[{ flex: 1 }, {color: 'white'}]}
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef && props.inputRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Animated.View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.4, // Default border width
    borderColor: theme.colors.text, // Default border color
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    gap: 12,
  },
});
