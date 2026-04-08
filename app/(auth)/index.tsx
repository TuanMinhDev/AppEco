import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Chào mừng bạn</Text>
            <Text style={styles.welcomeSubtitle}>Đến với FUSHION</Text>
            <Text style={styles.welcomeDescription}>Khám phá những sản phẩm thời trang tuyệt vời</Text>
          </View>
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
  },

  topSection: {
    alignItems: 'center',
  },

  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  welcomeTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 12,
    textAlign: 'center',
  },

  welcomeSubtitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },

  welcomeDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  buttonContainer: {
    width: '100%',
    gap: 20,
  },

  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
  },

  loginButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  registerButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextRes : {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
});