import { StyleSheet, TextInput, View } from 'react-native';
import React from 'react';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';

const NumberInput = (props) => {
  return (
    <View style={[
      styles.container,
      props.containerStyle && props.containerStyle,
    ]}>
      {props.icon && props.icon}
      <TextInput
        style={[
            { flex: 1, color: 'white', textAlign: 'center', fontWeight: theme.fonts.extraBold, fontSize: 25 }, 
        ]}
        placeholder="Enter 6-digit PIN"
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef && props.inputRef}
        keyboardType="numeric" 
        maxLength={6}
        {...props}
      />
    </View>
  );
};

export default NumberInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7.2),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },
});
