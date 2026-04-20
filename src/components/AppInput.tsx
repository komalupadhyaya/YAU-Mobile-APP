import { useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native';

export default function AppInput(props: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      {...props}
      style={[
        styles.input,
        isFocused && styles.inputFocused,
        props.style,
      ]}
      placeholderTextColor={props.placeholderTextColor || '#9CA3AF'}
      selectionColor="#2563EB"
      autoCapitalize={props.autoCapitalize ?? 'none'}
      autoCorrect={props.autoCorrect ?? false}
      editable={props.editable !== false}
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: '#2563EB',
  },
});
