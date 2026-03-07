import { useRegister } from '@/api/auth/auth.api';
import { IRegister } from '@/api/auth/auth.type';
import { AppInput } from '@/components/app-input';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        { text: 'OK', onPress: () => router.replace('/(auth)') },
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
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
                validate: (value: string) =>
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
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Bạn đã có tài khoản? <Text style={{ color: '#fbc414', fontSize: 15 }}>Đăng nhập</Text></Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'center',
    paddingTop: '18%',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
  },
  form: {
    width: '100%',
    gap: 30,
    marginTop: '10%',
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
    backgroundColor: '#fbc414',
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
