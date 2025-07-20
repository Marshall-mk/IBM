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
  Animated,
  Dimensions,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { bookmarkService } from '../../src/services/bookmarks';
import { clusteringService } from '../../src/services/clustering';
import { authService } from '../../src/services/auth';
import { AIService } from '../../src/services/aiService';
import { BookmarkData, BookmarkCluster, ClusteringMethod } from '../../src/types';
import { SummaryViewer } from '../../src/components/SummaryViewer';
import { useBookmarks } from '../../src/contexts/BookmarkContext';
import { ThemedText } from '../../src/components/ThemedText';
import { ThemedView } from '../../src/components/ThemedView';
import { Colors, Gradients, getGradient } from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ClustersScreen() {
  const { bookmarks, loading, refreshBookmarks } = useBookmarks();
  const [clusters, setClusters] = useState<BookmarkCluster[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clusteringMethod, setClusteringMethod] = useState<ClusteringMethod>('auto');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const router = useRouter();
  const { colorScheme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkAuthAndLoadClusters();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      generateClusters();
    }
  }, [clusteringMethod, bookmarks]); // Re-cluster when method or bookmarks change

  const checkAuthAndLoadClusters = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        await refreshBookmarks();
        generateClusters();
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/auth/login');
    }
  };

  const generateClusters = async () => {
    try {
      const generatedClusters = await clusteringService.createClusters(bookmarks, clusteringMethod);
      setClusters(generatedClusters);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate clusters');
      console.error('Cluster generation error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBookmarks();
    await generateClusters();
    setRefreshing(false);
  };

  const getMethodDisplayName = (method: ClusteringMethod): string => {
    const names = {
      auto: 'Smart',
      date: 'Time',
      category: 'Tags'
    };
    return names[method];
  };

  const getMethodIcon = (method: ClusteringMethod): string => {
    const icons = {
      auto: 'sparkles',
      date: 'time',
      category: 'pricetag'
    };
    return icons[method];
  };

  const renderFloatingDropdown = () => (
    <>
      <View style={[styles.fabContainer, { bottom: 90 + insets.bottom }]}>
        <LinearGradient
          colors={getGradient(isDarkMode ? Gradients.dark.fab : Gradients.light.fab)}
          style={styles.fab}
        >
          <TouchableOpacity 
            style={styles.fabButton}
            onPress={() => setShowDropdown(true)}
          >
            <Ionicons name={getMethodIcon(clusteringMethod) as any} size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
      
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            {(['auto', 'date', 'category'] as ClusteringMethod[]).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.dropdownItem,
                  clusteringMethod === method && { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }
                ]}
                onPress={() => {
                  setClusteringMethod(method);
                  setShowDropdown(false);
                }}
              >
                <View style={styles.dropdownItemContent}>
                  <Ionicons name={getMethodIcon(method) as any} size={16} color={clusteringMethod === method ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].text} />
                  <Text style={[
                    styles.dropdownItemText,
                    {
                      color: clusteringMethod === method 
                        ? Colors[colorScheme ?? 'light'].tint 
                        : Colors[colorScheme ?? 'light'].text
                    }
                  ]}>
                    {getMethodDisplayName(method)}
                  </Text>
                </View>
                {clusteringMethod === method && (
                  <Ionicons name="checkmark" size={16} color={Colors[colorScheme ?? 'light'].tint} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );

  const getClusterGradient = (color: string) => {
    const gradients: { [key: string]: readonly [string, string] } = {
      '#FF6B6B': ['#FF6B6B20', '#FF6B6B10'] as const,
      '#4ECDC4': ['#4ECDC420', '#4ECDC410'] as const,
      '#45B7D1': ['#45B7D120', '#45B7D110'] as const,
      '#96CEB4': ['#96CEB420', '#96CEB410'] as const,
      '#FFEAA7': ['#FFEAA720', '#FFEAA710'] as const,
      '#DDA0DD': ['#DDA0DD20', '#DDA0DD10'] as const,
      '#98D8C8': ['#98D8C820', '#98D8C810'] as const,
      '#F7DC6F': ['#F7DC6F20', '#F7DC6F10'] as const,
      '#BB8FCE': ['#BB8FCE20', '#BB8FCE10'] as const,
      '#85C1E9': ['#85C1E920', '#85C1E910'] as const,
    };
    return gradients[color] || (['#f0f0f020', '#f0f0f010'] as const);
  };

  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryBookmark, setSummaryBookmark] = useState<BookmarkData | null>(null);

  const getFaviconUrl = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  };

  const getPreviewImageWithFallback = (item: BookmarkData, useScreenshot: boolean = true) => {
    if (item.previewImage) {
      return { uri: item.previewImage };
    }
    
    if (!useScreenshot) {
      return { uri: getFaviconUrl(item.domain) };
    }
    
    const thumbUrl = `https://image.thum.io/get/width/400/crop/300/noanimate/${item.url}`;
    return { uri: thumbUrl };
  };

  const handleGenerateSummary = async (bookmarkIds: string[]) => {
    try {
      setIsGeneratingSummary(true);
      
      // Get authentication token
      const token = await authService.getToken();
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      // Show confirmation dialog with options
      Alert.alert(
        'Generate AI Summary',
        `Create an AI-powered summary of ${bookmarkIds.length} selected articles?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Generate',
            onPress: async () => {
              try {
                // Generate summary
                const response = await AIService.generateSummary(
                  bookmarkIds,
                  {
                    style: 'detailed',
                    maxLength: 500,
                    includeKeyPoints: true,
                  },
                  token
                );

                // Clear selection and close modal
                setSelectedBookmarks(new Set());
                setExpandedCluster(null);

                // Refresh bookmarks and regenerate clusters to show new summary
                await refreshBookmarks();
                await generateClusters();

                // Show success message
                Alert.alert(
                  'Summary Generated!',
                  'Your AI summary has been created and added to this cluster.',
                  [
                    {
                      text: 'OK',
                      style: 'default',
                    },
                  ]
                );
              } catch (error) {
                console.error('Summary generation failed:', error);
                Alert.alert(
                  'Summary Failed',
                  error instanceof Error 
                    ? error.message 
                    : 'Failed to generate summary. Please try again.',
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Summary preparation failed:', error);
      Alert.alert('Error', 'Failed to prepare summary generation.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const renderStackedCards = (cluster: BookmarkCluster) => {
    const maxCards = Math.min(cluster.bookmarks.length, 4);
    const cards = cluster.bookmarks.slice(0, maxCards);
    
    return (
      <View style={styles.stackedCardsContainer}>
        {cards.map((bookmark, idx) => {
          const rotation = (idx - (maxCards - 1) / 2) * 8; // Rotation angles: -12, -4, 4, 12 for 4 cards
          const zIndex = maxCards - idx;
          const translateY = idx * -3;
          const translateX = idx * 1.5;
          
          return (
            <Animated.View
              key={bookmark.id}
              style={[
                styles.stackedCard,
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate: `${rotation}deg` }
                  ],
                  zIndex,
                }
              ]}
            >
              <LinearGradient
                colors={getGradient(isDarkMode ? 
                  [Colors[colorScheme ?? 'light'].background + 'E0', Colors[colorScheme ?? 'light'].background + 'C0'] as const :
                  [Colors[colorScheme ?? 'light'].background + 'F0', Colors[colorScheme ?? 'light'].background + 'E0'] as const
                )}
                style={styles.stackedCardGradient}
              >
                <View style={styles.stackedCardContent}>
                  <Text style={[styles.stackedCardTitle, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={2}>
                    {bookmark.title}
                  </Text>
                  <Text style={[styles.stackedCardDomain, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]} numberOfLines={1}>
                    {bookmark.domain}
                  </Text>
                  {bookmark.categories.length > 0 && (
                    <View style={styles.stackedCardTags}>
                      <View style={[styles.stackedTag, { backgroundColor: cluster.color + '30' }]}>
                        <Text style={[styles.stackedTagText, { color: cluster.color }]}>
                          {bookmark.categories[0]}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderExpandedGrid = (cluster: BookmarkCluster) => {
    return (
      <Modal
        visible={expandedCluster === cluster.id}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExpandedCluster(null)}
      >
        <LinearGradient
          colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
          style={styles.expandedModal}
        >
          <SafeAreaView style={styles.expandedModalContent}>
          <View style={styles.expandedHeader}>
            <TouchableOpacity onPress={() => setExpandedCluster(null)}>
              <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
            {selectedBookmarks.size === 0 && (
              <Text style={[styles.expandedTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {cluster.title}
              </Text>
            )}
            {selectedBookmarks.size > 0 ? (
              <View style={styles.selectionActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.summaryButton]}
                  onPress={() => handleGenerateSummary(Array.from(selectedBookmarks))}
                  disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="sparkles" size={16} color="#fff" />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isGeneratingSummary ? 'Generating...' : `Summary (${selectedBookmarks.size})`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedBookmarks(new Set());
                  }}
                  style={[styles.actionButton, styles.cancelButton]}
                >
                  <Text style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.instructionText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Tap to visit • Hold to select
              </Text>
            )}
          </View>
          
          <FlatList
            data={cluster.bookmarks}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.expandedGrid}
            renderItem={({ item: bookmark, index }) => (
              <TouchableOpacity
                style={[
                  styles.expandedCard,
                  {
                    marginRight: index % 2 === 0 ? 8 : 0,
                    marginLeft: index % 2 === 1 ? 8 : 0,
                  }
                ]}
                onPress={async () => {
                  try {
                    // Handle summary cards specially
                    if (bookmark.url.startsWith('intellimark://summary/')) {
                      // Close the cluster modal first to avoid conflicts
                      setExpandedCluster(null);
                      
                      // Small delay to ensure modal transition completes
                      setTimeout(() => {
                        setSummaryBookmark(bookmark);
                      }, 100);
                      return;
                    }
                    
                    const canOpen = await Linking.canOpenURL(bookmark.url);
                    if (canOpen) {
                      await Linking.openURL(bookmark.url);
                    } else {
                      Alert.alert('Error', 'Cannot open this URL');
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to open URL');
                  }
                }}
                onLongPress={() => {
                  const newSelected = new Set(selectedBookmarks);
                  if (newSelected.has(bookmark.id)) {
                    newSelected.delete(bookmark.id);
                  } else {
                    newSelected.add(bookmark.id);
                  }
                  setSelectedBookmarks(newSelected);
                }}
              >
                <LinearGradient
                  colors={selectedBookmarks.has(bookmark.id) 
                    ? [Colors[colorScheme ?? 'light'].tint + '30', Colors[colorScheme ?? 'light'].tint + '20']
                    : getGradient(isDarkMode ? 
                        [Colors[colorScheme ?? 'light'].background + '95', Colors[colorScheme ?? 'light'].background + '85'] as const :
                        [Colors[colorScheme ?? 'light'].background + 'C0', Colors[colorScheme ?? 'light'].background + 'A5'] as const
                      )
                  }
                  style={styles.expandedCardGradient}
                >
                  {/* Rich webpage preview or AI Summary visual */}
                  <View style={styles.expandedPreviewContainer}>
                    {bookmark.url.startsWith('intellimark://summary/') ? (
                      // AI Summary custom preview
                      <LinearGradient
                        colors={['#FF6B9D', '#8B5FBF', '#4A90E2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.aiSummaryPreview}
                      >
                        <View style={styles.aiSummaryContent}>
                          <Ionicons name="sparkles" size={32} color="white" style={styles.aiSummaryIcon} />
                          <Text style={styles.aiSummaryTitle}>AI Summary</Text>
                          <View style={styles.aiSummaryLines}>
                            <View style={[styles.aiSummaryLine, { width: '80%' }]} />
                            <View style={[styles.aiSummaryLine, { width: '60%' }]} />
                            <View style={[styles.aiSummaryLine, { width: '90%' }]} />
                          </View>
                        </View>
                      </LinearGradient>
                    ) : (
                      // Regular webpage preview
                      <Image
                        source={getPreviewImageWithFallback(bookmark)}
                        style={styles.expandedPreviewImage}
                        defaultSource={require('../../assets/images/icon.png')}
                        resizeMode="cover"
                        onError={() => {
                          console.log('Screenshot failed for:', bookmark.domain);
                        }}
                      />
                    )}
                  </View>

                  {/* Bottom content */}
                  <View style={styles.expandedBottomContent}>
                    {selectedBookmarks.has(bookmark.id) && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                      </View>
                    )}
                    
                    {/* Domain badge */}
                    <View style={styles.expandedDomainRow}>
                      <View style={[styles.expandedDomainBadge, { 
                        backgroundColor: bookmark.url.startsWith('intellimark://summary/')
                          ? 'rgba(255, 107, 157, 0.2)'
                          : 'rgba(0,0,0,0.15)'
                      }]}>
                        <Ionicons 
                          name={bookmark.url.startsWith('intellimark://summary/') ? "sparkles" : "globe-outline"} 
                          size={12} 
                          color={bookmark.url.startsWith('intellimark://summary/') 
                            ? '#FF6B9D' 
                            : Colors[colorScheme ?? 'light'].tabIconDefault
                          } 
                        />
                        <Text style={[styles.expandedDomainText, { 
                          color: bookmark.url.startsWith('intellimark://summary/')
                            ? '#FF6B9D'
                            : Colors[colorScheme ?? 'light'].tabIconDefault 
                        }]}>
                          {bookmark.url.startsWith('intellimark://summary/') ? 'AI Summary' : bookmark.domain}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Date and actions row */}
                    <View style={styles.expandedBottomRow}>
                      <Text style={[styles.expandedCardDate, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        {new Date(bookmark.createdAt).toLocaleDateString()}
                      </Text>
                      
                      <View style={styles.expandedCardActions}>
                        <Ionicons name="open-outline" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          />
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    );
  };

  const renderClusterCard = ({ item: cluster, index }: { item: BookmarkCluster; index: number }) => {
    const cardWidth = (width - 60) / 2;
    const baseHeight = 220;
    const gradient = getClusterGradient(cluster.color);

    return (
      <>
        <TouchableOpacity 
          style={[
            styles.clusterCard,
            {
              width: cardWidth,
              height: baseHeight,
              marginLeft: index % 2 === 0 ? 0 : 10,
              marginRight: index % 2 === 0 ? 10 : 0,
            }
          ]}
          activeOpacity={0.8}
          onPress={() => setExpandedCluster(cluster.id)}
        >
          <LinearGradient
            colors={getGradient(gradient)}
            style={styles.cardGradient}
          >
            <View style={[styles.clusterIconContainer, { backgroundColor: cluster.color + '30' }]}>
              <Ionicons name={cluster.icon as any} size={28} color={cluster.color} />
            </View>
            
            <View style={styles.clusterCardContent}>
              <Text style={[styles.clusterCardTitle, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={2}>
                {cluster.title}
              </Text>
              
              <Text style={[styles.clusterCardCount, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                {cluster.bookmarks.length} items
              </Text>
              
              {renderStackedCards(cluster)}
            </View>
          </LinearGradient>
        </TouchableOpacity>
        {renderExpandedGrid(cluster)}
      </>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Checking authentication...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
        style={styles.contentContainer}
      >

        {/* Floating Dropdown */}
        {renderFloatingDropdown()}

        {/* Clusters List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>Analyzing bookmarks...</Text>
          </View>
        ) : (
          <FlatList
            data={clusters}
            renderItem={renderClusterCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors[colorScheme ?? 'light'].tint}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={isDarkMode ? 
                    [`${Gradients.dark.fab[0]}20`, `${Gradients.dark.fab[1]}20`] as const :
                    [`${Gradients.light.fab[0]}20`, `${Gradients.light.fab[1]}20`] as const
                  }
                  style={styles.emptyCard}
                >
                  <Ionicons name="layers" size={48} color="#45B7D1" />
                  <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>No clusters yet</Text>
                  <Text style={[styles.emptySubtext, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                    Save more bookmarks to see intelligent clusters
                  </Text>
                </LinearGradient>
              </View>
            }
          />
        )}

        {/* Summary Viewer */}
        {summaryBookmark && (
          <SummaryViewer
            bookmark={summaryBookmark}
            visible={!!summaryBookmark}
            onClose={() => setSummaryBookmark(null)}
          />
        )}
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
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 180,
    paddingRight: 20,
  },
  dropdown: {
    marginLeft: 'auto',
    marginRight: 0,
    width: 160,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  clusterCard: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
  },
  clusterIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  clusterCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  clusterCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  clusterCardCount: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  previewBookmarks: {
    flex: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  previewItem: {
    marginBottom: 6,
    overflow: 'hidden',
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 14,
  },
  previewDomain: {
    fontSize: 9,
    opacity: 0.7,
    lineHeight: 12,
  },
  moreItems: {
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  stackedCardsContainer: {
    height: 80,
    position: 'relative',
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedCard: {
    position: 'absolute',
    width: '92%',
    height: 65,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  stackedCardGradient: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  stackedCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stackedCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 14,
  },
  stackedCardDomain: {
    fontSize: 9,
    opacity: 0.7,
    marginBottom: 4,
  },
  stackedCardTags: {
    flexDirection: 'row',
    marginTop: 2,
  },
  stackedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stackedTagText: {
    fontSize: 8,
    fontWeight: '500',
  },
  expandedModal: {
    flex: 1,
  },
  expandedModalContent: {
    flex: 1,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  expandedTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  selectButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  expandedGrid: {
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  expandedCard: {
    flex: 1,
    height: 240,
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
  expandedCardGradient: {
    flex: 1,
    borderRadius: 16,
  },
  expandedPreviewContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  expandedPreviewImage: {
    width: '100%',
    height: '100%',
  },
  expandedBottomContent: {
    padding: 12,
    backgroundColor: 'transparent',
  },
  expandedDomainRow: {
    marginBottom: 8,
  },
  expandedDomainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  expandedDomainText: {
    fontSize: 11,
    fontWeight: '500',
  },
  expandedBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedCardDate: {
    fontSize: 11,
    opacity: 0.6,
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  expandedCardActions: {
    opacity: 0.6,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  summaryButton: {
    backgroundColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    padding: 16,
  },
  aiSummaryIcon: {
    marginBottom: 8,
    opacity: 0.9,
  },
  aiSummaryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.95,
  },
  aiSummaryLines: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  aiSummaryLine: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
});