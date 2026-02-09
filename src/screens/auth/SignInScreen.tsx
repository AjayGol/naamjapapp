import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, Text, Button, TextInput } from '../../components';

export const SignInScreen: React.FC = () => {
  return (
    <Screen>
      <View style={styles.container}>
        <Text variant="title" weight="bold">
          Welcome
        </Text>
        <Text variant="sm" color="textSecondary">
          Sign in to continue
        </Text>
        <TextInput label="Email" placeholder="name@example.com" keyboardType="email-address" />
        <TextInput label="Password" placeholder="••••••••" secureTextEntry />
        <Button label="Continue" onPress={() => {}} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
