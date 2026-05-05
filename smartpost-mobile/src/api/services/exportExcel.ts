import { Platform, Alert } from 'react-native';
import axiosClient from '../axiosClient';

import { File, Paths } from 'expo-file-system'; 

import { StorageAccessFramework, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';

import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer'; // Nhớ cài npm install buffer

export const exportExcel = {
  exportWaybills: async (filters: any) => {
    try {
      const res = await axiosClient.post('/waybills/export', filters);
      const dataToConvert = res.data ? res.data : res; 
      const fileName = `Danh_sach_Van_don_${new Date().getTime()}.xlsx`;

      if (Platform.OS === 'android') {
        // Dùng thẳng StorageAccessFramework đã import
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (!permissions.granted) {
          throw new Error('USER_CANCELLED');
        }

        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        const base64Data = Buffer.from(dataToConvert).toString('base64');

        await writeAsStringAsync(fileUri, base64Data, {
          encoding: EncodingType.Base64,
        });

        Alert.alert('Thành công', 'File Excel đã được lưu vào điện thoại của bạn!');
        return fileUri;
      } 
      
      else {
        const fileBytes = new Uint8Array(dataToConvert);
        const file = new File(Paths.document, fileName);

        await file.write(fileBytes);

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(file.uri, {
            UTI: 'com.microsoft.excel.xls', 
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Lưu Excel vào tệp',
          });
        }
        return file.uri;
      }

    } catch (error: any) {
      if (error.message === 'USER_CANCELLED') {
         return; 
      }
      throw error;
    }
  },
};