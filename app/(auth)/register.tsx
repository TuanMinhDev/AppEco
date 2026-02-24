import { router } from 'expo-router';
import React from 'react';
import { Button, Text, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Register</Text>
      <Button title="Sign Up (demo)" onPress={() => router.replace('/(tabs)')} />
      <Button title="Back to Login" onPress={() => router.back()} />
    </View>
  );
}
