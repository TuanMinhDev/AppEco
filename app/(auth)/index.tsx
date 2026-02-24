import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { useLogin } from '@/api/auth/auth.api';
import { AppInput } from '@/components/app-input';

export default function LoginScreen() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const loginMutation = useLogin({
    onSuccess: () => {
      router.replace('/(tabs)');
    },
  });

  const accountError = useMemo(() => {
    if (!submitted) return undefined;
    if (!account.trim()) return 'Vui lòng nhập tài khoản';
    return undefined;
  }, [account, submitted]);

  const passwordError = useMemo(() => {
    if (!submitted) return undefined;
    if (!password) return 'Vui lòng nhập mật khẩu';
    if (password.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    return undefined;
  }, [password, submitted]);

  const canSubmit = account.trim().length > 0 && password.length >= 6;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>

      <View style={styles.form}>
        <AppInput
          label="Tài khoản"
          value={account}
          onChangeText={setAccount}
          placeholder="Nhập tài khoản"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
          errorText={accountError}
        />

        <AppInput
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          errorText={passwordError}
        />

        <View style={styles.actions}>
          <Button
            title={loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            disabled={loginMutation.isPending}
            onPress={() => {
              setSubmitted(true);
              if (!canSubmit) return;

              console.log('login payload', {
                identifier: account,
                password,
              });

              loginMutation.mutate({
                identifier: account,
                password,
              });
            }}
          />

          {loginMutation.isError && (
            <Text style={styles.errorText}>
              {(loginMutation.error as any)?.response?.data?.message || 'Đăng nhập thất bại'}
            </Text>
          )}

          <Button
            title="Đăng ký"
            disabled={loginMutation.isPending}
            onPress={() => router.push('/register')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: 14,
  },
  actions: {
    gap: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
