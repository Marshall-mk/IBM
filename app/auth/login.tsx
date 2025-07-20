import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/services/auth';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import { Colors, Gradients, getGradient } from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();
  const { colorScheme, isDarkMode } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await authService.login({ email, password });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            {/* Header with improved design */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '10' }]}>
                <Ionicons 
                  name="bookmark" 
                  size={40} 
                  color={Colors[colorScheme ?? 'light'].tint} 
                />
              </View>
              <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
                Welcome back
              </Text>
              <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Sign in to your {Constants.expoConfig?.name || 'IntelliMark'} account
              </Text>
            </View>

            {/* Improved Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Email Address
                </Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    borderColor: emailFocused 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].border,
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  }
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={emailFocused 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].tabIconDefault
                    } 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Password
                </Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    borderColor: passwordFocused 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].border,
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  }
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={passwordFocused 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].tabIconDefault
                    } 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity 
                onPress={handleForgotPassword}
                style={styles.forgotPassword}
              >
                <Text style={[styles.forgotPasswordText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <LinearGradient
                colors={getGradient(isDarkMode ? Gradients.dark.button : Gradients.light.button)}
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled
                ]}
              >
                <TouchableOpacity
                  style={styles.loginButtonInner}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={handleRegister} style={styles.signUpButton}>
                <Text style={[styles.signUpText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 16,
    opacity: 0.7,
  },
  signUpButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  signUpText: {
    fontSize: 16,
    fontWeight: '600',
  },
});