/**
 * PersistenceService interface for saving and loading game data
 * Provides platform-agnostic storage operations
 */
export interface PersistenceService {
  /**
   * Save data to persistent storage
   * @param key Storage key
   * @param data Data to save
   * @returns Promise resolving to true if successful
   */
  save(key: string, data: any): Promise<boolean>;

  /**
   * Load data from persistent storage
   * @param key Storage key
   * @returns Promise resolving to the loaded data or null if not found
   */
  load(key: string): Promise<any>;

  /**
   * Delete data from persistent storage
   * @param key Storage key
   * @returns Promise resolving to true if successful
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists in storage
   * @param key Storage key
   * @returns Promise resolving to true if key exists
   */
  exists(key: string): Promise<boolean>;
}
