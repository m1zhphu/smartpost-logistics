import axiosClient from '../axiosClient';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const uploadService = {
  uploadPOD: async (imageUri: string): Promise<string> => {
    const formData = new FormData();
    
    formData.append('file', {
      uri: imageUri,
      name: `pod_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);

    const res = await axiosClient.post('/upload/pod', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.image_url;
  },
};