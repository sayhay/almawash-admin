import React from 'react';
import { ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';

export const Loader: React.FC<{ size?: 'small' | 'large' | number }> = ({ size = 'large' }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <ActivityIndicator animating size={size} />
  </View>
);
