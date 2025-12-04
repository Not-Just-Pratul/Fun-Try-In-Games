import { PersistenceService } from './PersistenceService';

/**
 * IndexedDB adapter for web platform persistence
 * Provides robust storage with better capacity than localStorage
 */
export class IndexedDBAdapter implements PersistenceService {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(dbName: string = 'ChainLedgeDB', storeName: string = 'gameData') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save data to IndexedDB
   */
  async save(key: string, data: any): Promise<boolean> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data, key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error(`Failed to save data: ${request.error}`));
      });
    } catch (error) {
      console.error('IndexedDB save error:', error);
      return false;
    }
  }

  /**
   * Load data from IndexedDB
   */
  async load(key: string): Promise<any> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(new Error(`Failed to load data: ${request.error}`));
      });
    } catch (error) {
      console.error('IndexedDB load error:', error);
      return null;
    }
  }

  /**
   * Delete data from IndexedDB
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.init();
      
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error(`Failed to delete data: ${request.error}`));
      });
    } catch (error) {
      console.error('IndexedDB delete error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists in IndexedDB
   */
  async exists(key: string): Promise<boolean> {
    try {
      const data = await this.load(key);
      return data !== null;
    } catch (error) {
      console.error('IndexedDB exists check error:', error);
      return false;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}
