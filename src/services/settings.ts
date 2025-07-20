import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, SyncStatus } from '../types';

class SettingsService {
  private defaultSettings: AppSettings = {
    theme: 'system',
    notifications: true,
    autoSync: true,
    briefingEmail: false,
    briefingFrequency: 'daily',
    briefingTime: '09:00',
  };

  async getSettings(): Promise<AppSettings> {
    try {
      const settingsString = await AsyncStorage.getItem('appSettings');
      if (settingsString) {
        const settings = JSON.parse(settingsString);
        return { ...this.defaultSettings, ...settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    
    return this.defaultSettings;
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const statusString = await AsyncStorage.getItem('syncStatus');
      if (statusString) {
        return JSON.parse(statusString);
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
    
    return {
      lastSync: 0,
      pendingItems: 0,
      isOnline: false,
      canSync: false,
    };
  }

  async updateSyncStatus(status: Partial<SyncStatus>): Promise<void> {
    try {
      const currentStatus = await this.getSyncStatus();
      const newStatus = { ...currentStatus, ...status };
      
      await AsyncStorage.setItem('syncStatus', JSON.stringify(newStatus));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  async getStorageUsage(): Promise<{ used: number; total: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return {
        used: totalSize,
        total: 5 * 1024 * 1024, // 5MB approximate limit for AsyncStorage
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, total: 0 };
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear data');
    }
  }

  async exportSettings(): Promise<string> {
    try {
      const settings = await this.getSettings();
      return JSON.stringify(settings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson);
      await this.updateSettings(settings);
    } catch (error) {
      console.error('Error importing settings:', error);
      throw new Error('Failed to import settings');
    }
  }

  async getSearchHistory(): Promise<string[]> {
    try {
      const historyString = await AsyncStorage.getItem('searchHistory');
      if (historyString) {
        return JSON.parse(historyString);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
    
    return [];
  }

  async addToSearchHistory(query: string): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      const updatedHistory = [query, ...history.filter(item => item !== query)].slice(0, 10);
      
      await AsyncStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('searchHistory');
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }
}

export const settingsService = new SettingsService();