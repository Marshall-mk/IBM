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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/services/auth';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import { Colors } from '../../src/constants/Colors';
import { useColorScheme } from '../../src/hooks/useColorScheme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (sent) {
    return (
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#f8fafc', '#e2e8f0']}
        style={styles.container}
      >
        <ThemedView style={styles.content}>
          <View style={styles.successHeader}>
            <View style={[styles.successIcon, { backgroundColor: '#4ECDC4' + '20' }]}>
              <Ionicons name="checkmark-circle" size={50} color="#4ECDC4" />
            </View>
            <Text style={[styles.successTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Check Your Email
            </Text>
            <Text style={[styles.successSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              We've sent a password reset link to{'\n'}
              <Text style={{ fontWeight: '600' }}>{email}</Text>
            </Text>
          </View>

          <View style={styles.instructions}>
            {[
              'Check your email inbox',
              'Click the reset link in the email',
              'Follow the instructions to reset your password',
              'Don\'t forget to check your spam folder'
            ].map((instruction, index) => (
              <View key={index} style={styles.instruction}>
                <View style={[styles.instructionBullet, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                  <Text style={styles.instructionNumber}>{index + 1}</Text>
                </View>
                <Text style={[styles.instructionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleBackToLogin}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </ThemedView>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#f8fafc', '#e2e8f0']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '10' }]}>
                <Ionicons 
                  name="key" 
                  size={40} 
                  color={Colors[colorScheme ?? 'light'].tint} 
                />
              </View>
              <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
                Reset Password
              </Text>
              <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Enter your email address and we'll send you a link to reset your password
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
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
                    backgroundColor: isDark ? '#374151' : '#ffffff',
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

              <TouchableOpacity
                style={[
                  styles.resetButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  loading && styles.resetButtonDisabled
                ]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.resetButtonText}>Send Reset Link</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Back Link */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleBackToLogin} style={styles.backLink}>
                <Ionicons name="arrow-back" size={16} color={Colors[colorScheme ?? 'light'].tint} />
                <Text style={[styles.linkText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Back to Login
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Success screen styles
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  instructions: {
    marginBottom: 32,
    gap: 16,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  instructionNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});