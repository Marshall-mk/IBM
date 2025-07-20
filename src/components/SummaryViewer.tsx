import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BookmarkData } from '../types';
import { Colors, Gradients, getGradient } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

interface SummaryViewerProps {
  bookmark: BookmarkData;
  visible: boolean;
  onClose: () => void;
}

export function SummaryViewer({ bookmark, visible, onClose }: SummaryViewerProps) {
  const { colorScheme, isDarkMode } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Ionicons 
                name="sparkles" 
                size={20} 
                color={Colors[colorScheme ?? 'light'].tint} 
                style={styles.headerIcon}
              />
              <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                AI Summary
              </Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.contentCard, { 
              backgroundColor: isDarkMode 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.8)' 
            }]}>
              <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
                {bookmark.title}
              </Text>
              
              {bookmark.categories && bookmark.categories.length > 0 && (
                <View style={styles.tagsContainer}>
                  {bookmark.categories
                    .filter(tag => tag !== 'ai-summary')
                    .slice(0, 3)
                    .map((tag, index) => (
                      <View 
                        key={index} 
                        style={[styles.tag, { 
                          backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' 
                        }]}
                      >
                        <Text style={[styles.tagText, { 
                          color: Colors[colorScheme ?? 'light'].tint 
                        }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                </View>
              )}

              <Text style={[styles.content, { color: Colors[colorScheme ?? 'light'].text }]}>
                {bookmark.content}
              </Text>

              {bookmark.aiAnalysis?.keyPoints && bookmark.aiAnalysis.keyPoints.length > 0 && (
                <View style={styles.keyPointsContainer}>
                  <Text style={[styles.keyPointsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Key Points
                  </Text>
                  {bookmark.aiAnalysis.keyPoints.map((point, index) => (
                    <View key={index} style={styles.keyPointItem}>
                      <Text style={[styles.keyPointBullet, { color: Colors[colorScheme ?? 'light'].tint }]}>
                        •
                      </Text>
                      <Text style={[styles.keyPointText, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {point}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  contentCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 28,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  keyPointsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyPointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  keyPointBullet: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    marginTop: 2,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});