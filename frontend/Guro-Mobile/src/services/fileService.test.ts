import { FileService } from './fileService';
import * as FileSystem from 'expo-file-system/legacy';

// Mock expo-file-system
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock-documents/',
  writeAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8' },
}));

describe('FileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveFile should write to string asynchronously and return file URI', async () => {
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

    const uri = await FileService.saveFile('test.txt', 'hello world');

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///mock-documents/test.txt',
      'hello world',
      expect.objectContaining({ encoding: 'utf8' })
    );
    expect(uri).toBe('file:///mock-documents/test.txt');
  });

  test('readFile should return content if file exists', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('file contents');

    const content = await FileService.readFile('test.txt');

    expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///mock-documents/test.txt');
    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      'file:///mock-documents/test.txt',
      expect.objectContaining({ encoding: 'utf8' })
    );
    expect(content).toBe('file contents');
  });

  test('readFile should return null if file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

    const content = await FileService.readFile('nonexistent.txt');

    expect(content).toBeNull();
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });

  test('listFiles should read directory contents and filter system files', async () => {
    (FileSystem.readDirectoryAsync as jest.Mock).mockResolvedValue([
      '.ds_store',
      'lesson-1.txt',
      'lesson-2.txt',
    ]);

    const list = await FileService.listFiles();

    expect(FileSystem.readDirectoryAsync).toHaveBeenCalledWith('file:///mock-documents/');
    expect(list).toEqual(['lesson-1.txt', 'lesson-2.txt']);
  });

  test('deleteFile should trigger file system deleteAsync', async () => {
    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

    await FileService.deleteFile('lesson-1.txt');

    expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
      'file:///mock-documents/lesson-1.txt',
      expect.objectContaining({ idempotent: true })
    );
  });
});
