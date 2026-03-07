import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function LoginScreen() {
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.topSection}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.textlogo}>FUSHION</Text>
            <Text style={styles.textHello}>Xin chào!</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={() => router.push('/login')}>
              <Text style={styles.buttonText}>Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={() => router.push('/register')}>
              <Text style={styles.buttonTextRes}>Đăng ký</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },

  topSection: {
    alignItems: 'center',
  },

  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 10,
  },

  textlogo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    letterSpacing: 2,
    color: '#fff',
  },

  buttonContainer: {
    width: '90%',
    gap: 16,
  },

  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50, // 👈 bo tròn
    alignItems: 'center',
  },

  loginButton: {
    backgroundColor: '#fbc414',
  },

  registerButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: '#fbc414',
    borderWidth: 1,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextRes : {
    color: '#fbc414',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textHello: {
    fontSize: 24,
    marginBottom: 50,
    color: 'rgba(255,255,255,0.7)'
  },
});