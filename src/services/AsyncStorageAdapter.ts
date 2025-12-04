import { PersistenceService } from './PersistenceService';

/**
 * AsyncStorage adapter for React Native platform
 * Note: This requires @react-native-async-storage/async-storage to be installed
 * For web-only builds, this adapter won't be used
 */
export class AsyncStorageAdapter implements PersistenceService {
  private storage: any;
  private prefix: string;

  constructor(prefix: string = 'chainledge_') {
    this.prefix = prefix;
    
    // Dynamically import AsyncStorage if available
    try {
      // This will be resolved at runtime in React Native environment
      this.storage = require('@react-native-async-storage/async-storage').default;
    } catch (error) {
      console.warn('AsyncStorage not available. This adapter is for React Native only.');
      this.storage = null;
    }
  }

  /**
   * Get the full key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Save data to AsyncStorage
   */
  async save(key: string, data: any): Promise<boolean> {
    if (!this.storage) {
      console.error('AsyncStorage not available');
      return false;
    }

    try {
      const serialized = JSON.stringify(data);
      await this.storage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error('AsyncStorage save error:', error);
      return false;
    }
  }

  /**
   * Load data from AsyncStorage
   */
  async load(key: string): Promise<any> {
    if (!this.storage) {
      console.error('AsyncStorage not available');
      return null;
    }

    try {
      const serialized = await this.storage.getItem(this.getKey(key));
      
      if (serialized === null) {
        return null;
      }
      
      return JSON.parse(serialized);
    } catch (error) {
      console.error('AsyncStorage load error:', error);
      return null;
    }
  }

  /**
   * Delete data from AsyncStorage
   */
  async delete(key: string): Promise<boolean> {
    if (!this.storage) {
      console.error('AsyncStorage not available');
      return false;
    }

    try {
      await this.storage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('AsyncStorage delete error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in AsyncStorage
   */
  async exists(key: string): Promise<boolean> {
    if (!this.storage) {
      console.error('AsyncStorage not available');
      return false;
    }

    try {
      const value = await this.storage.getItem(this.getKey(key));
      return value !== null;
    } catch (error) {
      console.error('AsyncStorage exists check error:', error);
      return false;
    }
  }

  /**
   * Clear all data with the prefix
   */
  async clearAll(): Promise<boolean> {
    if (!this.storage) {
      console.error('AsyncStorage not available');
      return false;
    }

    try {
      const keys = await this.storage.getAllKeys();
      const prefixedKeys = keys.filter((k: string) => k.startsWith(this.prefix));
      await this.storage.multiRemove(prefixedKeys);
      return true;
    } catch (error) {
      console.error('AsyncStorage clearAll error:', error);
      return false;
    }
  }
}
