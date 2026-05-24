import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import {
  StorageAccessFramework,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Buffer } from "buffer";
import { waybillService } from "./waybillService";

export const exportExcelService = {
  exportWaybills: async (token, filters) => {
    try {
      const dataToConvert = await waybillService.exportWaybills(token, filters);
      const fileName = `Danh_sach_Van_don_${new Date().getTime()}.xlsx`;

      if (Platform.OS === "android") {
        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          throw new Error("USER_CANCELLED");
        }

        const fileUri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );

        const base64Data = Buffer.from(dataToConvert).toString("base64");

        await writeAsStringAsync(fileUri, base64Data, {
          encoding: EncodingType.Base64,
        });

        Alert.alert(
          "Thành công",
          "File Excel đã được lưu vào thiết bị của bạn.",
        );
        return fileUri;
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const base64Data = Buffer.from(dataToConvert).toString("base64");

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          UTI: "com.microsoft.excel.xls",
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Lưu Excel vào tệp",
        });
      }

      return fileUri;
    } catch (error) {
      if (error.message === "USER_CANCELLED") {
        return null;
      }

      throw error;
    }
  },
};
