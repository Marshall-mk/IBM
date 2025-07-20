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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');
  const router = useRouter();
  const { colorScheme, isDarkMode } = useTheme();

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=])[A-Za-z\d@$!%*?&#+\-_=]+$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Error',
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.register({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account, then log in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'An error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.replace('/auth/login');
  };


  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&#+\-_=]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

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
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '10' }]}>
                <Ionicons 
                  name="person-add" 
                  size={40} 
                  color={Colors[colorScheme ?? 'light'].tint} 
                />
              </View>
              <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
                Create Account
              </Text>
              <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Join {Constants.expoConfig?.name || 'IntelliMark'} and start organizing your bookmarks with AI
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Name Fields */}
              <View style={styles.nameContainer}>
                <View style={styles.nameInput}>
                  <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                    First Name
                  </Text>
                  <View style={[
                    styles.inputWrapper,
                    {
                      borderColor: focusedInput === 'firstName' 
                        ? Colors[colorScheme ?? 'light'].tint 
                        : Colors[colorScheme ?? 'light'].border,
                      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                    }
                  ]}>
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={focusedInput === 'firstName' 
                        ? Colors[colorScheme ?? 'light'].tint 
                        : Colors[colorScheme ?? 'light'].tabIconDefault
                      } 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Optional"
                      placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                      autoCapitalize="words"
                      onFocus={() => setFocusedInput('firstName')}
                      onBlur={() => setFocusedInput('')}
                    />
                  </View>
                </View>

                <View style={styles.nameInput}>
                  <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Last Name
                  </Text>
                  <View style={[
                    styles.inputWrapper,
                    {
                      borderColor: focusedInput === 'lastName' 
                        ? Colors[colorScheme ?? 'light'].tint 
                        : Colors[colorScheme ?? 'light'].border,
                      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                    }
                  ]}>
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={focusedInput === 'lastName' 
                        ? Colors[colorScheme ?? 'light'].tint 
                        : Colors[colorScheme ?? 'light'].tabIconDefault
                      } 
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Optional"
                      placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                      autoCapitalize="words"
                      onFocus={() => setFocusedInput('lastName')}
                      onBlur={() => setFocusedInput('')}
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Email Address *
                </Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    borderColor: focusedInput === 'email' 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].border,
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  }
                ]}>
                  <Ionicons 
                    name="mail-outline" 
                    size={20} 
                    color={focusedInput === 'email' 
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
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput('')}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Password *
                </Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    borderColor: focusedInput === 'password' 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].border,
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  }
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={focusedInput === 'password' 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].tabIconDefault
                    } 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a strong password"
                    placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput('')}
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
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.passwordStrength}>
                    <View style={styles.strengthBar}>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.strengthSegment,
                            {
                              backgroundColor: passwordStrength >= level 
                                ? (passwordStrength < 3 ? '#FF6B6B' : passwordStrength < 4 ? '#FFD93D' : '#4ECDC4')
                                : Colors[colorScheme ?? 'light'].border
                            }
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {passwordStrength < 3 ? 'Weak' : passwordStrength < 4 ? 'Medium' : 'Strong'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Confirm Password *
                </Text>
                <View style={[
                  styles.inputWrapper,
                  {
                    borderColor: focusedInput === 'confirmPassword' 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].border,
                    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  }
                ]}>
                  <Ionicons 
                    name="lock-closed-outline" 
                    size={20} 
                    color={focusedInput === 'confirmPassword' 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : Colors[colorScheme ?? 'light'].tabIconDefault
                    } 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput('')}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color={Colors[colorScheme ?? 'light'].tabIconDefault} 
                    />
                  </TouchableOpacity>
                </View>
                
                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.passwordMatch}>
                    <Ionicons 
                      name={password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={password === confirmPassword ? '#4ECDC4' : '#FF6B6B'} 
                    />
                    <Text style={[
                      styles.matchText, 
                      { 
                        color: password === confirmPassword ? '#4ECDC4' : '#FF6B6B'
                      }
                    ]}>
                      {password === confirmPassword ? 'Passwords match' : 'Passwords don\'t match'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Password Requirements Warning - Only show when focused and requirements not met */}
              {focusedInput === 'password' && password.length > 0 && passwordStrength < 5 && (
                <View style={styles.passwordWarning}>
                  <View style={styles.warningHeader}>
                    <Ionicons name="warning" size={16} color="#FF6B6B" />
                    <Text style={[styles.warningTitle, { color: '#FF6B6B' }]}>
                      Password Requirements
                    </Text>
                  </View>
                  <View style={styles.warningList}>
                    {[
                      { text: 'At least 8 characters', check: password.length >= 8 },
                      { text: 'One uppercase letter', check: /[A-Z]/.test(password) },
                      { text: 'One lowercase letter', check: /[a-z]/.test(password) },
                      { text: 'One number', check: /\d/.test(password) },
                      { text: 'One special character', check: /[@$!%*?&#+\-_=]/.test(password) },
                    ]
                    .filter(req => !req.check) // Only show unmet requirements
                    .map((req, index) => (
                      <Text key={index} style={[styles.warningText, { color: '#FF6B6B' }]}>
                        • {req.text}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Register Button */}
              <LinearGradient
                colors={getGradient(isDarkMode ? Gradients.dark.button : Gradients.light.button)}
                style={[
                  styles.registerButton,
                  loading && styles.registerButtonDisabled
                ]}
              >
                <TouchableOpacity
                  style={styles.registerButtonInner}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                <Text style={[styles.loginText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Sign In
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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 24,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
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
  passwordStrength: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 2,
    flex: 1,
  },
  strengthSegment: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 50,
  },
  passwordMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '500',
  },
  passwordWarning: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FF6B6B' + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B' + '30',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningList: {
    gap: 2,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  registerButton: {
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
  registerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
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
  loginButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '600',
  },
});