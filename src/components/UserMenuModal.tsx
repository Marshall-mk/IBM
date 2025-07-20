import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Colors, Gradients, getGradient } from '../constants/Colors';
import { authService } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UserMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

export function UserMenuModal({ visible, onClose, onNavigate }: UserMenuModalProps) {
  const { colorScheme, themeMode, setThemeMode, isDarkMode } = useTheme();
  const [userInfo, setUserInfo] = useState({
    firstName: 'User',
    lastName: '',
    email: '',
    plan: 'Free Plan'
  });
  
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      // Load user info when modal opens
      loadUserInfo();
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const loadUserInfo = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setUserInfo({
          firstName: user.firstName || 'User',
          lastName: user.lastName || '',
          email: user.email || '',
          plan: user.plan || 'Free Plan' // Get from user data or default to Free Plan
        });
      }
    } catch (error) {
      console.log('Could not load user info:', error);
      // Keep default values
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        slideAnim.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -SCREEN_WIDTH * 0.3) {
        onClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              onClose();
              onNavigate?.('auth');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available in a future update.');
          },
        },
      ]
    );
  };

  const menuItems: any[] = [];

  const settingsItems = [
    {
      title: 'Dark Mode',
      icon: 'moon-outline',
      isSwitch: true,
      value: isDarkMode,
      onValueChange: (value: boolean) => {
        setThemeMode(value ? 'dark' : 'light');
      },
    },
    {
      title: 'Get Help or Send Feedback',
      icon: 'help-circle-outline',
      onPress: () => {
        onNavigate?.('feedback');
        onClose();
      },
    },
    {
      title: `Sign out of ${Constants.expoConfig?.name || 'IntelliMark'}`,
      icon: 'log-out-outline',
      onPress: handleSignOut,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Menu Panel */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={getGradient(Gradients.userPage)}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.greeting}>Small daily improvements</Text>
              <Text style={styles.greeting}>are invisible... until</Text>
              <Text style={styles.greeting}>they're undeniable.</Text>
              <Text style={styles.userName}>{userInfo.firstName}</Text>
              <Text style={styles.userName}>{userInfo.lastName}</Text>
              
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>YOUR ACCOUNT</Text>
                <Text style={styles.email}>{userInfo.email}</Text>
                
                <Text style={styles.planLabel}>YOUR PLAN</Text>
                <Text style={styles.planName}>{userInfo.plan}</Text>
              </View>
            </View>

            {/* Settings Section */}
            <View style={styles.settingsContainer}>
              {settingsItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.settingItem}
                  onPress={item.isSwitch ? undefined : item.onPress}
                  disabled={item.isSwitch}
                >
                  <View style={styles.settingContent}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color="rgba(0,0,0,0.6)"
                      style={styles.settingIcon}
                    />
                    <Text style={styles.settingText}>{item.title}</Text>
                  </View>
                  {item.isSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: 'rgba(0,0,0,0.1)', true: 'rgba(0,0,0,0.3)' }}
                      thumbColor={item.value ? '#333' : '#ccc'}
                    />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="rgba(0,0,0,0.3)"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerLabel}>DANGER ZONE</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.deleteButtonText}>DELETE MY ACCOUNT</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.versionText}>
                {Constants.expoConfig?.name || 'IntelliMark'} v{Constants.expoConfig?.version || '1.0.0'} ({Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1'})
              </Text>
              <View style={styles.logoContainer}>
                <Ionicons name="bulb-outline" size={24} color="rgba(0,0,0,0.3)" />
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  overlayTouch: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000',
    lineHeight: 38,
  },
  userName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 38,
  },
  accountInfo: {
    marginTop: 30,
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#000',
    marginBottom: 16,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  planName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    minHeight: 56,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.8)',
    fontWeight: '500',
    flex: 1,
  },
  dangerZone: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  dangerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255,0,0,0.85)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    minHeight: 56,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    marginBottom: 16,
  },
  logoContainer: {
    padding: 8,
  },
});