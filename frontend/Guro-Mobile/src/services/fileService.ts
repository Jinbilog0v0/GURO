import * as FileSystem from 'expo-file-system/legacy';

const BASE_DIR = FileSystem.documentDirectory;

export const FileService = {
  /**
   * Saves a text file locally.
   */
  saveFile: async (fileName: string, content: string): Promise<string> => {
    if (!BASE_DIR) throw new Error('File system directory not available');
    const fileUri = `${BASE_DIR}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return fileUri;
  },

  /**
   * Reads a local text file.
   */
  readFile: async (fileName: string): Promise<string | null> => {
    if (!BASE_DIR) return null;
    const fileUri = `${BASE_DIR}${fileName}`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return null;
      }
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  },

  /**
   * Lists all saved files in the document directory.
   */
  listFiles: async (): Promise<string[]> => {
    if (!BASE_DIR) return [];
    try {
      const files = await FileSystem.readDirectoryAsync(BASE_DIR);
      // Filter out system files if any, only return .txt or user created files
      return files.filter(f => !f.startsWith('.'));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  },

  /**
   * Deletes a file.
   */
  deleteFile: async (fileName: string): Promise<void> => {
    if (!BASE_DIR) return;
    const fileUri = `${BASE_DIR}${fileName}`;
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
};
