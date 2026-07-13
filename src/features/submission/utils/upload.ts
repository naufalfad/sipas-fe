import { API_BASE_URL } from '@/config';

export const uploadFileToBackend = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = sessionStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/submissions/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Gagal mengunggah berkas ke server');
  }

  const data = await response.json();
  return data; // { file_name, file_path, file_url }
};
