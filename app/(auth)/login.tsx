import { useLogin } from "@/api/auth/auth.api";
import { AppInput } from "@/components/app-input";
import { ErrorModal } from "@/components/error-modal";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type LoginForm = {
  account: string;
  password: string;
};

export default function LoginScreen() {
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      account: "",
      password: "",
    },
  });

  const loginMutation = useLogin({
    onSuccess: () => {
      router.replace("/(tabs)");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrorMessage(message);
      setErrorModalVisible(true);
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
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
          <Text style={styles.title}>Đăng nhập</Text>

          <View style={styles.form}>
            <AppInput
              label="Tài khoản"
              name="account"
              control={control}
              rules={{
                required: "Vui lòng nhập tài khoản",
              }}
              placeholder="Nhập tài khoản"
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
                required: "Vui lòng nhập mật khẩu",
                minLength: {
                  value: 6,
                  message: "Mật khẩu tối thiểu 6 ký tự",
                },
              }}
              placeholder="Nhập mật khẩu"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              // onPressForgot={() => {}}
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.loginButton]}
                onPress={handleSubmit(onSubmit)}
                disabled={loginMutation.isPending}
              >
                <Text style={styles.buttonText}>
                  {loginMutation.isPending ? "Loading..." : "Đăng nhập"}
                </Text>
              </TouchableOpacity>

              <View style={styles.textRes}>
                <TouchableOpacity
                  onPress={() => router.push("/register")}
                  disabled={loginMutation.isPending}
                >
                  <Text
                    style={{ color: "#64748B", fontSize: 15 }}
                  >
                    Bạn chưa có tài khoản?{" "}
                    <Text
                      style={{
                        color: '#3B82F6',
                        fontSize: 15,
                        fontWeight: 'bold',
                      }}
                    >
                      Đăng ký
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.boxDiv}>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialLogin}>
                <Text style={styles.socialText}>Hoặc đăng nhập với</Text>
                <View style={styles.socialButtons}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.facebookButton]}
                  >
                    <FontAwesome name="facebook-f" size={20} color="#1877f2" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.googleButton]}
                  >
                    <AntDesign name="google" size={20} color="#DB4437" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
      
      <ErrorModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
    alignItems: "center",
    paddingTop: "20%",
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1E40AF',
  },
  form: {
    width: "100%",
    gap: 30,
    marginTop: "20%",
  },
  actions: {
    marginTop: "10%",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  textRes: {
    marginTop: "10%",
    alignItems: "center",
  },
  socialLogin: {
    marginTop: "5%",
    alignItems: "center",
  },
  socialText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 15,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  facebookButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  googleButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  socialIcon: {
    marginRight: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  boxDiv: {
    marginTop: "10%",
    justifyContent: "center",
  },
});
