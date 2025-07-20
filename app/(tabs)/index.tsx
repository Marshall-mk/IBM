import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
  Image,
  Linking,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bookmarkService } from '../../src/services/bookmarks';
import { authService } from '../../src/services/auth';
import { BookmarkData } from '../../src/types';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import AddBookmarkModal from '../../src/components/AddBookmarkModal';
import { UserMenuModal } from '../../src/components/UserMenuModal';
import { Colors, Gradients, getGradient } from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function BookmarksScreen() {
  const [allBookmarks, setAllBookmarks] = useState<BookmarkData[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fabScale] = useState(new Animated.Value(1));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [failedScreenshots, setFailedScreenshots] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { colorScheme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkAuthAndLoadBookmarks();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter bookmarks based on debounced search query
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setFilteredBookmarks(allBookmarks);
    } else {
      const filtered = allBookmarks.filter(bookmark => {
        const query = debouncedSearchQuery.toLowerCase();
        return (
          bookmark.title.toLowerCase().includes(query) ||
          bookmark.content?.toLowerCase().includes(query) ||
          bookmark.domain.toLowerCase().includes(query) ||
          bookmark.categories.some(cat => cat.toLowerCase().includes(query))
        );
      });
      setFilteredBookmarks(filtered);
    }
  }, [debouncedSearchQuery, allBookmarks]);

  // Pan responder for swipe-to-open user menu
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to swipes from the left edge
      return gestureState.dx > 20 && Math.abs(gestureState.dy) < 80;
    },
    onPanResponderMove: (_, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (_, gestureState) => {
      // Open menu if swipe is long enough and primarily horizontal
      if (gestureState.dx > 100 && Math.abs(gestureState.dy) < 100) {
        setShowUserMenu(true);
      }
    },
  });

  const handleUserMenuNavigate = (screen: string) => {
    switch (screen) {
      case 'auth':
        router.replace('/auth/login');
        break;
      case 'feedback':
        // TODO: Navigate to feedback screen
        Alert.alert('Coming Soon', 'Feedback system will be available soon.');
        break;
      default:
        break;
    }
  };

  const checkAuthAndLoadBookmarks = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        await loadBookmarks();
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/auth/login');
    }
  };

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      
      // Try to load from backend first
      try {
        // Load all bookmarks without search filter - we'll filter client-side
        const data = await bookmarkService.getBookmarks();
        setAllBookmarks(data);
      } catch (error) {
        // If backend is not available, preserve existing bookmarks if any, otherwise show sample data
        console.log('Backend not available, preserving local bookmarks or showing sample data');
        setAllBookmarks(prev => {
          // If we have existing bookmarks (user added some), keep them
          // Otherwise, show sample data for demo
          return prev.length > 0 ? prev : getSampleBookmarks();
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookmarks');
      console.error('Load bookmarks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSampleBookmarks = (): BookmarkData[] => {
    return [
      {
        id: '1',
        url: 'https://huggingface.co/papers',
        title: 'HuggingFace Papers',
        content: 'Latest AI research papers and models from the HuggingFace community.',
        domain: 'huggingface.co',
        previewImage: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg',
        isRead: false,
        isFavorite: true,
        categories: ['Learning', 'Research'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        url: 'https://github.com/microsoft/vscode',
        title: 'VS Code Repository',
        content: 'Visual Studio Code - The popular code editor by Microsoft.',
        domain: 'github.com',
        previewImage: 'https://github.com/microsoft/vscode/raw/main/resources/linux/code.png',
        isRead: true,
        isFavorite: false,
        categories: ['Git/Code', 'Tools'],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        url: 'https://www.twitter.com/reactjs',
        title: 'React on Twitter',
        content: 'Official React Twitter account with updates and news.',
        domain: 'twitter.com',
        isRead: false,
        isFavorite: false,
        categories: ['Social', 'Git/Code'],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  };

  const toggleFavorite = async (id: string) => {
    try {
      await bookmarkService.toggleFavorite(id);
      await loadBookmarks(); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle favorite');
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await bookmarkService.markAsRead(id);
      await loadBookmarks(); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  const deleteBookmark = async (id: string) => {
    Alert.alert(
      'Delete Bookmark',
      'Are you sure you want to delete this bookmark?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from UI immediately
              setAllBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
              
              // Try to delete from backend
              try {
                await bookmarkService.deleteBookmark(id);
              } catch (error) {
                console.log('Backend unavailable, bookmark deleted locally only:', error);
              }
            } catch (error) {
              console.error('Failed to delete bookmark:', error);
              Alert.alert('Error', 'Failed to delete bookmark');
              // Reload bookmarks to restore state
              await loadBookmarks();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleFabPress = () => {
    // Animate FAB press
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show add bookmark modal
    setShowAddModal(true);
  };

  const handleAddBookmark = async (url: string, tags: string[]) => {
    try {
      // Extract domain from URL
      let domain = 'unknown';
      try {
        domain = new URL(url).hostname;
      } catch (e) {
        console.log('Could not extract domain from URL');
      }
      
      // Convert tag IDs to readable labels
      const TAG_ID_TO_LABEL: { [key: string]: string } = {
        'git': 'Git/Code',
        'paper': 'Research',
        'socials': 'Social',
        'news': 'News',
        'tools': 'Tools',
        'learning': 'Learning',
        'design': 'Design',
        'other': 'Other',
      };
      
      const readableCategories = tags.map(tagId => TAG_ID_TO_LABEL[tagId] || tagId);
      
      // Create a bookmark with a simple title based on domain
      const newBookmark: BookmarkData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url,
        title: `Bookmark from ${domain}`,
        content: `Saved bookmark with tags: ${readableCategories.join(', ')}`,
        domain,
        isRead: false,
        isFavorite: false,
        categories: readableCategories,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setAllBookmarks(prev => [newBookmark, ...prev]);
      
      // Try to save to backend, but don't worry if it fails
      try {
        await bookmarkService.createBookmark({
          url,
          title: newBookmark.title,
          content: newBookmark.content,
          categories: readableCategories,
        });
        console.log('Bookmark saved to backend successfully');
      } catch (error) {
        console.log('Backend unavailable, bookmark saved locally only:', error);
      }
      
      Alert.alert('Success', 'Bookmark saved successfully!');
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      Alert.alert('Error', 'Failed to save bookmark. Please try again.');
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

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
    
    // Try multiple screenshot services for better reliability
    
    // 1. Thum.io - 1000 free per month, no auth
    const thumbUrl = `https://image.thum.io/get/width/400/crop/300/noanimate/${item.url}`;
    
    // 2. Alternative: Screenshot Machine (if Thum.io fails)
    // const screenshotMachine = `https://api.screenshotmachine.com/?key=YOUR_KEY&url=${encodeURIComponent(item.url)}&dimension=1024x768`;
    
    // 3. Alternative: ApiFlash free tier
    // const apiFlash = `https://api.apiflash.com/v1/urltoimage?access_key=YOUR_KEY&url=${encodeURIComponent(item.url)}&width=400&height=300`;
    
    return { uri: thumbUrl };
  };

  const renderBookmarkItem = ({ item, index }: { item: BookmarkData; index: number }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.bookmarkCard, 
          { 
            marginRight: index % 2 === 0 ? 8 : 0,
            marginLeft: index % 2 === 1 ? 8 : 0,
          }
        ]}
        onPress={() => handleOpenLink(item.url)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={getGradient(isDarkMode ? 
            [Colors[colorScheme ?? 'light'].background + '95', Colors[colorScheme ?? 'light'].background + '85'] as const :
            [Colors[colorScheme ?? 'light'].background + 'C0', Colors[colorScheme ?? 'light'].background + 'A5'] as const
          )}
          style={styles.bookmarkCardGradient}
        >

        {/* Rich webpage preview */}
        <View style={styles.previewContainer}>
          <Image
            source={getPreviewImageWithFallback(item, !failedScreenshots.has(item.id))}
            style={[
              styles.previewImage,
              failedScreenshots.has(item.id) && styles.faviconFallback
            ]}
            defaultSource={require('../../assets/images/icon.png')}
            resizeMode={failedScreenshots.has(item.id) ? "contain" : "cover"}
            onError={() => {
              console.log('Screenshot failed for:', item.domain, 'falling back to favicon');
              setFailedScreenshots(prev => new Set([...prev, item.id]));
            }}
          />
        </View>

        {/* Bottom content */}
        <View style={styles.bottomContent}>
          {/* Domain badge in text area */}
          <View style={styles.domainRow}>
            <View style={[styles.domainBadgeBottom, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
              <Ionicons name="globe-outline" size={12} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
              <Text style={[styles.domainTextBottom, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                {item.domain}
              </Text>
            </View>
          </View>
          
          {/* Date and delete row */}
          <View style={styles.bottomRow}>
            <Text style={[styles.cardDate, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              {formatDate(item.createdAt)}
            </Text>
            
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                deleteBookmark(item.id);
              }}
              style={styles.deleteButton}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
            </TouchableOpacity>
          </View>
        </View>
        </LinearGradient>
      </TouchableOpacity>
    );
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
        style={styles.contentContainer}
        {...panResponder.panHandlers}
      >
        {/* Header with Menu Button and Search Bar */}
        <View 
          style={[
            styles.searchContainer, 
            { 
              paddingTop: 8, // Additional padding after safe area
              backgroundColor: 'transparent',
            }
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowUserMenu(true)}
            >
              <Ionicons name="menu" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
            
            <View style={[styles.searchInputContainer, { borderColor: Colors[colorScheme ?? 'light'].border }]}>
            <Ionicons name="search" size={20} color={Colors[colorScheme ?? 'light'].icon} />
            <TextInput
              style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Search bookmarks..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery !== debouncedSearchQuery && (
              <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
            )}
            {searchQuery.trim() && searchQuery === debouncedSearchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIcon}>
                <Ionicons name="close-circle" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
              </TouchableOpacity>
            )}
            </View>
          </View>
        </View>

      {/* Bookmarks List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>Loading bookmarks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={filteredBookmarks.length === 0 ? styles.emptyList : styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <View style={styles.emptyContainer}>
                {debouncedSearchQuery.trim() ? (
                  // No search results
                  <>
                    <View style={styles.emptyIllustration}>
                      <View style={[styles.emptyCard, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '15' }]}>
                        <Ionicons name="search" size={32} color={Colors[colorScheme ?? 'light'].tint} />
                      </View>
                    </View>
                    
                    <View style={styles.emptyTextContainer}>
                      <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>No results found</Text>
                      <Text style={[styles.emptySubtext, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        Try adjusting your search terms or browse all bookmarks
                      </Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.clearSearchButton, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
                      onPress={() => setSearchQuery('')}
                    >
                      <Text style={[styles.clearSearchText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                        Clear search
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // No bookmarks at all
                  <>
                    <View style={styles.emptyIllustration}>
                      <View style={[styles.emptyCard, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '10' }]}>
                        <Ionicons name="bookmark" size={32} color={Colors[colorScheme ?? 'light'].tint} />
                      </View>
                      <View style={[styles.emptyCard, styles.emptyCardSecond, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                        <Ionicons name="link" size={28} color={Colors[colorScheme ?? 'light'].tint} />
                      </View>
                      <View style={[styles.emptyCard, styles.emptyCardThird, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '15' }]}>
                        <Ionicons name="star" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                      </View>
                    </View>
                    
                    <View style={styles.emptyTextContainer}>
                      <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>Your bookmark collection awaits</Text>
                      <Text style={[styles.emptySubtext, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        Save interesting articles, websites, and resources in one place
                      </Text>
                    </View>

                    <LinearGradient
                      colors={getGradient(isDarkMode ? Gradients.dark.button : Gradients.light.button)}
                      style={styles.getStartedButton}
                    >
                      <TouchableOpacity 
                        style={styles.getStartedButtonInner}
                        onPress={() => setShowAddModal(true)}
                      >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.getStartedText}>Add your first bookmark</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </>
                )}
              </View>
            </View>
          }
        />
      )}

        {/* Floating Action Button */}
        <Animated.View style={[
          styles.fabContainer, 
          { 
            transform: [{ scale: fabScale }],
            bottom: 90 + insets.bottom, // Account for tab bar height + safe area
          }
        ]}>
          <LinearGradient
            colors={getGradient(isDarkMode ? Gradients.dark.fab : Gradients.light.fab)}
            style={styles.fab}
          >
            <TouchableOpacity 
              style={styles.fabButton}
              onPress={handleFabPress}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Add Bookmark Modal */}
        <AddBookmarkModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddBookmark}
        />

        {/* User Menu Modal */}
        <UserMenuModal
          visible={showUserMenu}
          onClose={() => setShowUserMenu(false)}
          onNavigate={handleUserMenuNavigate}
        />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearIcon: {
    padding: 2,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingTop: 32, // More clearance from search bar
    paddingBottom: 100, // Extra space for FAB
  },
  bookmarkCard: {
    flex: 1,
    height: 240, // Increased height for rich previews
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    maxWidth: (width - 48) / 2,
  },
  bookmarkCardGradient: {
    flex: 1,
    borderRadius: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  faviconFallback: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  bottomContent: {
    padding: 12,
    backgroundColor: 'transparent',
  },
  domainRow: {
    marginBottom: 8,
  },
  domainBadgeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  domainTextBottom: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  emptyWrapper: {
    width: width,
    minHeight: 400,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: -60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyIllustration: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  emptyCard: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyCardSecond: {
    top: 20,
    left: 50,
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  emptyCardThird: {
    top: 50,
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  emptyTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.8,
  },
  getStartedButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  getStartedButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  getStartedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearSearchButton: {
    borderWidth: 2,
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  clearSearchText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    // bottom is set dynamically based on safe area insets
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
