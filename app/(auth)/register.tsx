import { useRegister } from '@/api/auth/auth.api';
import { IRegister } from '@/api/auth/auth.type';
import { AppInput } from '@/components/app-input';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/utils/api-error-message';

type RegisterForm = IRegister & { confirmPassword: string };

function RegisterFormContent() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { control, handleSubmit, watch } = useFormContext<RegisterForm>();

  const registerMutation = useRegister({
    onSuccess: () => {
      toast.showSuccess('Đăng ký thành công! Vui lòng đăng nhập.', {
        onHidden: () => router.replace('/(auth)'),
      });
    },
    onError: (error: unknown) => {
      toast.showError(getApiErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại.'));
    },
  });

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword, ...payload } = data;
    registerMutation.mutate(payload);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...AppEco.heroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.heroHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.replace('/(auth)/login')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Đăng ký</Text>
        </View>
      </LinearGradient>

      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentHeader}>
            <Text style={styles.welcomeTitle}>Tạo tài khoản Pine Studio trong vài bước</Text>
          </View>

          <View style={styles.formSection}>
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

          <TouchableOpacity
            style={[styles.primaryBtn, registerMutation.isPending && styles.primaryBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={registerMutation.isPending}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>
              {registerMutation.isPending ? 'Đang xử lý…' : 'Đăng ký'}
            </Text>
          </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            disabled={registerMutation.isPending}
            style={styles.footerLinkWrap}
          >
            <Text style={styles.footerMuted}>
              Bạn đã có tài khoản? <Text style={styles.footerLink}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default function RegisterScreen() {
  const form = useForm<RegisterForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
    },
  });

  return (
    <FormProvider {...form}>
      <RegisterFormContent />
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppEco.surface,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: AppEco.radiusXl,
    borderBottomRightRadius: AppEco.radiusXl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  sheet: {
    flex: 1,
    backgroundColor: AppEco.surface,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  welcomeTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: AppEco.text,
    lineHeight: 28,
    maxWidth: 300,
  },
  formSection: {
    gap: 16,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: AppEco.primary,
    paddingVertical: 16,
    borderRadius: AppEco.radiusLg,
    alignItems: 'center',
    ...AppEco.shadowCard,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footerLinkWrap: { alignItems: 'center', marginTop: 24 },
  footerMuted: { fontSize: 15, color: AppEco.textSecondary },
  footerLink: { color: AppEco.primary, fontWeight: '700' },
});
