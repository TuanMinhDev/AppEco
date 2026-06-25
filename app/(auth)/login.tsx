import { useLogin } from '@/api/auth/auth.api';
import { AppInput } from '@/components/app-input';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/utils/api-error-message';

type LoginForm = {
  account: string;
  password: string;
};

function isSafeInternalRedirect(path: string | undefined): path is string {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  return true;
}

function LoginFormContent() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { redirect: redirectParam } = useLocalSearchParams<{ redirect?: string | string[] }>();
  const redirect = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;

  const { control, handleSubmit } = useFormContext<LoginForm>();

  const loginMutation = useLogin({
    onSuccess: () => {
      const next =
        typeof redirect === 'string' && isSafeInternalRedirect(redirect)
          ? redirect
          : '/(tabs)';
      router.replace(next as any);
    },
    onError: (error: unknown) => {
      toast.showError(
        getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.'),
      );
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({
      identifier: data.account,
      password: data.password,
    });
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
            onPress={() => router.replace('/(auth)')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Đăng nhập</Text>
        </View>
      </LinearGradient>

      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentHeader}>
            <Text style={styles.welcomeTitle}>Chào mừng trở lại Pine Studio</Text>
            <Text style={styles.welcomeSub}>
              Tiếp tục mua sắm xanh và khám phá gợi ý dành riêng cho bạn.
            </Text>
          </View>

          <View style={styles.formSection}>
            <AppInput
              label="Tài khoản"
              name="account"
              control={control}
              rules={{ required: 'Vui lòng nhập tài khoản' }}
              placeholder="Email hoặc số điện thoại"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
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
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loginMutation.isPending && styles.primaryBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>
                {loginMutation.isPending ? 'Đang xử lý…' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/register')}
              disabled={loginMutation.isPending}
              style={styles.footerLinkWrap}
            >
              <Text style={styles.footerMuted}>
                Bạn chưa có tài khoản?{' '}
                <Text style={styles.footerLink}>Đăng ký</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

export default function LoginScreen() {
  const form = useForm<LoginForm>({
    defaultValues: { account: '', password: '' },
  });

  return (
    <FormProvider {...form}>
      <LoginFormContent />
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
  },
  welcomeSub: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: AppEco.textSecondary,
    maxWidth: 300,
  },
  formSection: {
    gap: 16,
    paddingTop: 30,
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
  footerLinkWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerMuted: {
    fontSize: 15,
    color: AppEco.textSecondary,
  },
  footerLink: {
    color: AppEco.primary,
    fontWeight: '700',
  },
});
