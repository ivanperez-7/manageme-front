import { withAuth } from '@/lib/auth';
import { toast } from 'sonner';

export async function downloadBlob(
  url: string,
  filename: string,
  params?: Record<string, string | undefined>,
) {
  try {
    const res = await withAuth.get(url, { responseType: 'blob', params });
    const data = res.data as Blob;
    const objectUrl = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch (error: unknown) {
    let msg = 'No se pudo descargar el archivo';
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { data?: unknown } };
      if (err.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await err.response.data.text());
          msg = body.detail || msg;
        } catch { /* ignore parse errors */ }
      }
    }
    toast.error(msg);
  }
}
