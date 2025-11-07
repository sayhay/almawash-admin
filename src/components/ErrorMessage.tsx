import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText } from 'react-native-paper';

interface ErrorMessageProps {
  message?: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <HelperText type="error" visible>{message}</HelperText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
});
