import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, getGradient } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

interface AddBookmarkModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (url: string, tags: string[]) => Promise<void>;
}

const TAG_OPTIONS = [
  { id: 'git', label: 'Git/Code', icon: 'logo-github', color: '#24292e' },
  { id: 'paper', label: 'Research', icon: 'document-text', color: '#0066cc' },
  { id: 'socials', label: 'Social', icon: 'people', color: '#1da1f2' },
  { id: 'news', label: 'News', icon: 'newspaper', color: '#ff6b35' },
  { id: 'tools', label: 'Tools', icon: 'build', color: '#28a745' },
  { id: 'learning', label: 'Learning', icon: 'school', color: '#6f42c1' },
  { id: 'design', label: 'Design', icon: 'color-palette', color: '#fd7e14' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6c757d' },
];

export default function AddBookmarkModal({ visible, onClose, onSave }: AddBookmarkModalProps) {
  const [url, setUrl] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);
  const { colorScheme, isDarkMode } = useTheme();

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert('Error', 'Please select at least one tag');
      return;
    }

    console.log('🏷️ Modal - Saving bookmark with tags:', selectedTags);

    setLoading(true);
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.match(/^https?:\/\//)) {
        formattedUrl = 'https://' + formattedUrl;
      }

      await onSave(formattedUrl, selectedTags);
      setUrl('');
      setSelectedTags([]);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save bookmark');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClose = () => {
    setUrl('');
    setSelectedTags([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={getGradient(isDarkMode ? Gradients.dark.primary : Gradients.light.primary)}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons 
                name="close" 
                size={24} 
                color={Colors[colorScheme ?? 'light'].text} 
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Add Bookmark
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.illustration}>
              <View style={[styles.illustrationCard, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                <Ionicons name="bookmark" size={40} color={Colors[colorScheme ?? 'light'].tint} />
              </View>
            </View>

            <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Save your favorite link with tags
            </Text>

            {/* URL Input */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Website URL
              </Text>
              <View style={[
                styles.inputWrapper,
                {
                  borderColor: urlFocused 
                    ? Colors[colorScheme ?? 'light'].tint 
                    : Colors[colorScheme ?? 'light'].border,
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                }
              ]}>
                <Ionicons 
                  name="link-outline" 
                  size={20} 
                  color={urlFocused 
                    ? Colors[colorScheme ?? 'light'].tint 
                    : Colors[colorScheme ?? 'light'].tabIconDefault
                  } 
                />
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
                  placeholder="https://example.com"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={url}
                  onChangeText={setUrl}
                  onFocus={() => setUrlFocused(true)}
                  onBlur={() => setUrlFocused(false)}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Tags Selection */}
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                Select Tags ({selectedTags.length} selected)
              </Text>
              <View style={styles.tagsGrid}>
                {TAG_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagOption,
                        {
                          backgroundColor: isSelected 
                            ? tag.color + '20' 
                            : Colors[colorScheme ?? 'light'].background,
                          borderColor: isSelected 
                            ? tag.color 
                            : Colors[colorScheme ?? 'light'].border,
                        }
                      ]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Ionicons 
                        name={tag.icon as any} 
                        size={20} 
                        color={isSelected ? tag.color : Colors[colorScheme ?? 'light'].tabIconDefault} 
                      />
                      <Text style={[
                        styles.tagText,
                        {
                          color: isSelected 
                            ? tag.color 
                            : Colors[colorScheme ?? 'light'].text
                        }
                      ]}>
                        {tag.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color={tag.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save Button */}
            <LinearGradient
              colors={getGradient(isDarkMode ? Gradients.dark.button : Gradients.light.button)}
              style={[
                styles.saveButton,
                { opacity: loading ? 0.7 : 1 }
              ]}
            >
              <TouchableOpacity
                style={styles.saveButtonInner}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="bookmark" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Save Bookmark</Text>
                  </>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    gap: 6,
    minWidth: '45%',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  saveButton: {
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});