import { StyleSheet, TextInput, View, Animated } from 'react-native';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';

export const Input = (props) => {
  return (
    <View style={[
          styles.container,
          props.containerStyle && props.containerStyle,
        ]}>
      {props.icon && props.icon}
      <TextInput
        style={[{ flex: 1, color: 'white', textAlign: 'center', fontWeight: theme.fonts.extraBold, fontSize: 25 }, ]}
        placeholderTextColor={theme.colors.textLight}
        ref={props.inputRef && props.inputRef}
        {...props}
      />
    </View>
  );
};

export default Input;

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
