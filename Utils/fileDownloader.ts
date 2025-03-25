import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { IMessage } from 'react-native-gifted-chat';

// Types
export interface File {
  url: string; // Base64 string or file URL
  name: string; // File name with extension
  mimeType: string; // MIME type
}

export interface AttachmentUploadResponse {
  attachmentId: number;
  fileName?: string;
  fileType?: string;
}

export interface FileMessage extends IMessage {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface DirectoryChange {
  downloadsFolder?: string | null;
  isSelecting?: boolean;
}

type DownloadStatus = 'ok' | 'error';

// FileDownloader Class
class FileDownloader {
  private static async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  private static async requestDirectoryPermissions(
    onDirectoryChange: (change: DirectoryChange) => void,
  ): Promise<string | null> {
    try {
      onDirectoryChange({ isSelecting: true });
      const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Downloads');
      const { granted, directoryUri } =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
      onDirectoryChange({ downloadsFolder: granted ? directoryUri : null, isSelecting: false });
      return granted ? directoryUri : null;
    } catch (error) {
      console.error('Error requesting directory permissions:', error);
      onDirectoryChange({ downloadsFolder: null, isSelecting: false });
      return null;
    }
  }

  private static async saveBase64File(
    file: File,
    downloadsFolder: string | null,
  ): Promise<DownloadStatus> {
    try {
      const base64Data = file.url.split(',')[1];
      if (Platform.OS === 'android' && downloadsFolder) {
        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          downloadsFolder,
          file.name,
          file.mimeType,
        );
        await FileSystem.writeAsStringAsync(newFileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        const fileUri = `${FileSystem.documentDirectory}${file.name}`;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/')) {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);
        }
      }
      return 'ok';
    } catch (error) {
      console.error('Error saving base64 file:', error);
      return 'error';
    }
  }

  private static async saveRemoteFile(
    file: File,
    downloadsFolder: string | null,
  ): Promise<DownloadStatus> {
    try {
      const { uri } = await FileSystem.downloadAsync(
        file.url,
        `${FileSystem.cacheDirectory}${file.name}`,
      );
      if (Platform.OS === 'android' && downloadsFolder) {
        const fileString = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          downloadsFolder,
          file.name,
          file.mimeType,
        );
        await FileSystem.writeAsStringAsync(newFileUri, fileString, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Downloads', asset, false);
      }
      return 'ok';
    } catch (error) {
      console.error('Error saving remote file:', error);
      return 'error';
    }
  }

  public static async downloadFilesAsync(
    files: File[],
    onDirectoryChange: (change: DirectoryChange) => void,
  ): Promise<{ status: DownloadStatus }> {
    try {
      if (!(await this.requestMediaLibraryPermission())) {
        return { status: 'error' };
      }

      const downloadsFolder = await this.requestDirectoryPermissions(onDirectoryChange);
      if (!downloadsFolder) {
        return { status: 'error' };
      }

      const results = await Promise.all(
        files.map((file) =>
          file.url.startsWith('data:')
            ? this.saveBase64File(file, downloadsFolder)
            : this.saveRemoteFile(file, downloadsFolder),
        ),
      );

      return { status: results.every((result) => result === 'ok') ? 'ok' : 'error' };
    } catch (error) {
      console.error('Error downloading files:', error);
      return { status: 'error' };
    }
  }
}

export default FileDownloader;
