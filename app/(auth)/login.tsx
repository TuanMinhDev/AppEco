import { useLogin } from '@/api/auth/auth.api';
import { AppInput } from '@/components/app-input';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    <>
      <View style={[styles.root, { paddingBottom: insets.bottom + 12 }]}>
        <LinearGradient
          colors={[...AppEco.heroGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.heroHeader}>
            {/* <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.replace('/(auth)')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
            >
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity> */}
            <Text style={styles.heroTitle}>Đăng nhập</Text>
          </View>
          <Text style={styles.heroSub}>Chào mừng trở lại Pine Studio</Text>
        </LinearGradient>

        <SafeAreaView style={styles.sheetSafe} edges={[]}>
          <View style={styles.form}>
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

          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Hoặc</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
                <FontAwesome name="facebook-f" size={20} color="#1877f2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.85}>
                <AntDesign name="google" size={20} color="#DB4437" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

    </>
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
    backgroundColor: AppEco.background,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderBottomLeftRadius: AppEco.radiusXl,
    borderBottomRightRadius: AppEco.radiusXl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    marginTop:10
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
  heroSub: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  sheetSafe: {
    flex: 1,
    backgroundColor: AppEco.background,
  },
  form: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    gap: 18,
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
  footerLinkWrap: { alignItems: 'center', marginTop: 4 },
  footerMuted: {
    fontSize: 15,
    color: AppEco.textSecondary,
  },
  footerLink: {
    color: AppEco.primary,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  divider: { flex: 1, height: 1, backgroundColor: AppEco.borderSoft },
  dividerText: { fontSize: 13, color: AppEco.textMuted, fontWeight: '600' },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AppEco.surface,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppEco.shadowCard,
  },
});
