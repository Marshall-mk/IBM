import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { bookmarkService } from '../../src/services/bookmarks';
import { authService } from '../../src/services/auth';
import { BookmarkData } from '../../src/types';
import { useBookmarks } from '../../src/contexts/BookmarkContext';
import { Colors, Gradients, getGradient } from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const SWIPE_THRESHOLD = width * 0.3;

// Rich preview functions
const getFaviconUrl = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

const getPreviewImageWithFallback = (item: BookmarkData, useScreenshot: boolean = true) => {
  if (item.previewImage) {
    return { uri: item.previewImage };
  }
  
  if (!useScreenshot) {
    // Fallback to favicon
    return { uri: getFaviconUrl(item.domain) };
  }
  
  // Use Thum.io - 1000 free screenshots per month, no authentication required
  const thumbUrl = `https://image.thum.io/get/width/400/crop/300/noanimate/${item.url}`;
  
  return { uri: thumbUrl };
};

export default function DeclutterScreen() {
  const { bookmarks, loading, refreshBookmarks, deleteBookmarks } = useBookmarks();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [processed, setProcessed] = useState(0);
  
  const router = useRouter();
  const { colorScheme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Simplified pan responder for basic swipe detection
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        translateX.setValue(gestureState.dx);
        // Add slight rotation based on horizontal movement
        const rotationValue = gestureState.dx / width * 30;
        rotate.setValue(rotationValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          handleSwipe(gestureState.dx > 0 ? 'right' : 'left');
        } else {
          resetCardPosition();
        }
      },
    })
  ).current;

  useEffect(() => {
    checkAuthAndLoadBookmarks();
  }, []);

  // Reset declutter state when bookmarks change (user visits page again)
  useEffect(() => {
    if (bookmarks.length > 0 && currentIndex >= bookmarks.length) {
      setCurrentIndex(0);
      setProcessed(0);
      resetCardPosition();
    }
  }, [bookmarks]);

  const checkAuthAndLoadBookmarks = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        await refreshBookmarks();
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/auth/login');
    }
  };


  const resetCardPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.spring(opacity, {
        toValue: 1,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -width : width;
    
    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotate, {
        toValue: direction === 'left' ? -30 : 30,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (direction === 'left') {
        handleForget();
      } else {
        handleKeep();
      }
    });
  };

  const handleForget = async () => {
    const currentBookmark = bookmarks[currentIndex];
    if (!currentBookmark) return;

    try {
      // Remove from shared state immediately
      deleteBookmarks([currentBookmark.id]);
      
      // Try to delete from backend
      try {
        await bookmarkService.deleteBookmark(currentBookmark.id);
      } catch (error) {
        console.log('Backend unavailable, bookmark deleted locally only:', error);
      }
      
      moveToNext();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      moveToNext();
    }
  };

  const handleKeep = () => {
    moveToNext();
  };

  const moveToNext = () => {
    setProcessed(prev => prev + 1);
    
    if (currentIndex < bookmarks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetCardPosition();
    } else {
      // All bookmarks processed - just move to completed state
      setCurrentIndex(bookmarks.length);
    }
  };


  const getCurrentBookmark = () => {
    return bookmarks[currentIndex];
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
          style={styles.centerContainer}
        >
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>Checking authentication...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
          style={styles.centerContainer}
        >
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>Loading bookmarks...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const currentBookmark = getCurrentBookmark();

  if (!currentBookmark) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
          style={styles.contentContainer}
        >
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[Gradients.accent[0] + '20', Gradients.accent[1] + '20'] as const}
              style={styles.emptyCard}
            >
              <Ionicons name="checkmark-circle" size={64} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>All Done!</Text>
              <Text style={[styles.emptySubtext, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                You've reviewed all your bookmarks
              </Text>
            </LinearGradient>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
        style={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Declutter
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            {processed + 1} of {bookmarks.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: Colors[colorScheme ?? 'light'].border }]}>
          <LinearGradient
            colors={getGradient(isDarkMode ? Gradients.dark.accent : Gradients.light.accent)}
            style={[styles.progressBar, { width: `${((processed + 1) / bookmarks.length) * 100}%` }]}
          />
        </View>

        {/* Card Container */}
        <View style={styles.cardContainer}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { 
                    rotate: rotate.interpolate({
                      inputRange: [-50, 0, 50],
                      outputRange: ['-15deg', '0deg', '15deg'],
                      extrapolate: 'clamp',
                    })
                  },
                  { scale },
                ],
                opacity,
              },
            ]}
          >
            <LinearGradient
              colors={getGradient(isDarkMode ? 
                [Colors[colorScheme ?? 'light'].background + '95', Colors[colorScheme ?? 'light'].background + '85'] as const :
                [Colors[colorScheme ?? 'light'].background + 'C0', Colors[colorScheme ?? 'light'].background + 'A5'] as const
              )}
              style={styles.cardGradient}
            >
              {/* Domain Badge */}
              <View style={[styles.domainBadge, { 
                backgroundColor: currentBookmark.url.startsWith('intellimark://summary/')
                  ? 'rgba(255, 107, 157, 0.2)'
                  : Colors[colorScheme ?? 'light'].tint + '20'
              }]}>
                <Ionicons 
                  name={currentBookmark.url.startsWith('intellimark://summary/') ? "sparkles" : "globe"} 
                  size={16} 
                  color={currentBookmark.url.startsWith('intellimark://summary/') 
                    ? '#FF6B9D' 
                    : Colors[colorScheme ?? 'light'].tint
                  } 
                />
                <Text style={[styles.domainText, { 
                  color: currentBookmark.url.startsWith('intellimark://summary/')
                    ? '#FF6B9D'
                    : Colors[colorScheme ?? 'light'].tint 
                }]}>
                  {currentBookmark.url.startsWith('intellimark://summary/') ? 'AI Summary' : currentBookmark.domain}
                </Text>
              </View>

              {/* Rich Preview or AI Summary visual */}
              <View style={styles.previewContainer}>
                {currentBookmark.url.startsWith('intellimark://summary/') ? (
                  // AI Summary custom preview
                  <LinearGradient
                    colors={['#FF6B9D', '#8B5FBF', '#4A90E2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aiSummaryPreview}
                  >
                    <View style={styles.aiSummaryContent}>
                      <Ionicons name="sparkles" size={48} color="white" style={styles.aiSummaryIcon} />
                      <Text style={styles.aiSummaryTitle}>AI Summary</Text>
                      <View style={styles.aiSummaryLines}>
                        <View style={[styles.aiSummaryLine, { width: '85%' }]} />
                        <View style={[styles.aiSummaryLine, { width: '70%' }]} />
                        <View style={[styles.aiSummaryLine, { width: '90%' }]} />
                        <View style={[styles.aiSummaryLine, { width: '60%' }]} />
                      </View>
                    </View>
                  </LinearGradient>
                ) : (
                  // Regular webpage preview
                  <Image
                    source={getPreviewImageWithFallback(currentBookmark)}
                    style={styles.previewImage}
                    defaultSource={require('../../assets/images/icon.png')}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* Minimal Content - Only URL and Tags */}
              <View style={styles.minimalContent}>
                {/* URL */}
                <Text style={[styles.cardUrl, { color: Colors[colorScheme ?? 'light'].tint }]} numberOfLines={2}>
                  {currentBookmark.url}
                </Text>

                {/* Categories */}
                {currentBookmark.categories.length > 0 && (
                  <View style={styles.categoriesContainer}>
                    {currentBookmark.categories.slice(0, 3).map((category, index) => (
                      <View
                        key={index}
                        style={[styles.categoryTag, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}
                      >
                        <Text style={[styles.categoryText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                          {category}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Action Buttons - Fixed at bottom */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.forgetButton]}
            onPress={() => handleSwipe('left')}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.keepButton]}
            onPress={() => handleSwipe('right')}
          >
            <Ionicons name="heart" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  progressContainer: {
    height: 4,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140, // More space for action buttons
  },
  card: {
    width: CARD_WIDTH,
    height: height * 0.45, // Increased to accommodate preview
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
    display: 'flex',
    flexDirection: 'column',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 4,
  },
  domainText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    height: 280, // Even larger preview, dominate the card
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  minimalContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  cardUrl: {
    fontSize: 13, // Slightly smaller to fit better
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 8, // Reduced spacing
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4, // Reduced spacing
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 40, // More bottom padding for safe area
    gap: 20,
    position: 'absolute',
    bottom: 80, // Move up from very bottom to account for tab bar
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  forgetButton: {
    backgroundColor: '#FF6B6B',
  },
  keepButton: {
    backgroundColor: '#4ECDC4',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  aiSummaryPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSummaryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  aiSummaryIcon: {
    marginBottom: 12,
    opacity: 0.9,
  },
  aiSummaryTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.95,
  },
  aiSummaryLines: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  aiSummaryLine: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
});