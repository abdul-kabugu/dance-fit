export async function uploadToBlob(file: File, filename?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (filename) {
    formData.append('filename', filename);
  }

  const response = await fetch('/api/uploads', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file.');
  }

  return (await response.json()) as { url: string; pathname: string };
}
