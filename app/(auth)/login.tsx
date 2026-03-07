import { useLogin } from '@/api/auth/auth.api';
import { AppInput } from '@/components/app-input';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
type LoginForm = {
    account: string;
    password: string;
};

export default function LoginScreen() {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        defaultValues: {
            account: '',
            password: '',
        },
    });

    const loginMutation = useLogin({
        onSuccess: () => {
            router.replace('/(tabs)');
        },
    });

    const onSubmit = (data: LoginForm) => {
        

        loginMutation.mutate({
            identifier: data.account,
            password: data.password,
        });
    };

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.container}>
                    <Text style={styles.title}>Đăng nhập</Text>

                    <View style={styles.form}>
                        <AppInput
                            label="Tài khoản"
                            name="account"
                            control={control}
                            rules={{
                                required: 'Vui lòng nhập tài khoản',
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
                                required: 'Vui lòng nhập mật khẩu',
                                minLength: {
                                    value: 6,
                                    message: 'Mật khẩu tối thiểu 6 ký tự',
                                },
                            }}
                            placeholder="Nhập mật khẩu"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                            // onPressForgot={() => console.log('Forgot password pressed')}
                        />

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.loginButton]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={loginMutation.isPending}
                            >
                                <Text style={styles.buttonText}>
                                    {loginMutation.isPending ? 'Loading...' : 'Đăng nhập'}
                                </Text>
                            </TouchableOpacity>

                            {/* {loginMutation.isError && (
                                <Text style={styles.errorText}>
                                    {(loginMutation.error as any)?.response?.data?.message || 'Đăng nhập thất bại'}
                                </Text>
                            )} */}
                            <View style={styles.textRes}>
                                <TouchableOpacity
                                    onPress={() => router.push('/register')}
                                    disabled={loginMutation.isPending}
                                >
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>Bạn chưa có tài khoản? <Text style={{ color: '#fbc414', fontSize: 15 }}>Đăng ký</Text></Text></TouchableOpacity>
                            </View>
                            <View style={styles.boxDiv}><View style={styles.divider} /></View>


                            <View style={styles.socialLogin}>
                                <Text style={styles.socialText}>Hoặc đăng nhập với</Text>
                                <View style={styles.socialButtons}>
                                    <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
                                        <FontAwesome name="facebook-f" size={20} color="#1877f2" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
                                        <AntDesign name="google" size={20} color="#DB4437" />                            </TouchableOpacity>
                                </View>
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
        paddingTop: '40%',
    },
    logo: {
        width: 180,
        height: 180,
        resizeMode: 'contain',
        marginBottom: 10,
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
        marginTop: '20%',
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
    loginButton: {
        backgroundColor: '#fbc414',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    textRes: {
        marginTop: '10%',
        alignItems: 'center',
    },
    socialLogin: {
        marginTop: '5%',
        alignItems: 'center',
    },
    socialText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 15,
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    facebookButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    googleButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    socialButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    socialIcon: {
        marginRight: 8,
    },
    divider: {
        width: '80%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 20,
    },
    boxDiv: {
        marginTop: '10%',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
