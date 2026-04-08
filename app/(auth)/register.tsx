import { useRegister } from '@/api/auth/auth.api';
import { IRegister } from '@/api/auth/auth.type';
import { AppInput } from '@/components/app-input';
import { router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RegisterForm = IRegister & { confirmPassword: string };

export default function RegisterScreen() {
  const {
    control,
    handleSubmit,
    watch,
  } = useForm<RegisterForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    },
  });

  const registerMutation = useRegister({
    onSuccess: () => {
      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
        { text: 'Đồng ý', onPress: () => router.replace('/(auth)') },
      ]);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi', message);
    },
  });

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword, ...payload } = data;
    registerMutation.mutate(payload);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.container}>
            <Text style={styles.title}>Đăng ký</Text>

            <View style={styles.form}>
              <AppInput
                label="Họ và tên"
                name="name"
                control={control}
                rules={{ required: 'Vui lòng nhập họ và tên' }}
                placeholder="Nhập họ và tên"
                autoCorrect={false}
                returnKeyType="next"
              />

              <AppInput
                label="Email"
                name="email"
                control={control}
                rules={{
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email không hợp lệ',
                  },
                }}
                placeholder="Nhập email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />

              <AppInput
                label="Số điện thoại"
                name="phoneNumber"
                control={control}
                rules={{
                  required: 'Vui lòng nhập số điện thoại',
                  pattern: {
                    value: /^[0-9]{9,11}$/,
                    message: 'Số điện thoại không hợp lệ',
                  },
                }}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
                returnKeyType="next"
              />

              <AppInput
                label="Mật khẩu"
                name="password"
                control={control}
                rules={{
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                }}
                placeholder="Nhập mật khẩu"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <AppInput
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                control={control}
                rules={{
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (value: string | undefined) =>
                    value === watch('password') || 'Mật khẩu xác nhận không khớp',
                }}
                placeholder="Nhập lại mật khẩu"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.registerButton]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={registerMutation.isPending}
                >
                  <Text style={styles.buttonText}>
                    {registerMutation.isPending ? 'Loading...' : 'Đăng ký'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.textRes}>
                  <TouchableOpacity
                    onPress={() => router.replace('/(auth)/login')}
                    disabled={registerMutation.isPending}
                  >
                    <Text style={{ color: '#64748B', fontSize: 15 }}>Bạn đã có tài khoản? <Text style={{ color: '#3B82F6', fontSize: 15, fontWeight: 'bold' }}>Đăng nhập</Text></Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    paddingHorizontal: 24,
    gap: 24,
    alignItems: 'center',
    paddingTop: '10%',
    paddingBottom: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1E40AF',
    marginBottom: 10,
  },
  form: {
    width: '100%',
    gap: 30,
    marginTop: '0%',
  },
  actions: {
    marginTop: '10%',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textRes: {
    marginTop: '10%',
    alignItems: 'center',
  },
});
