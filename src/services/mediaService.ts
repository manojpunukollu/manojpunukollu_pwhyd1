/**
 * Fetches media from a URL via the server-side proxy to avoid CORS issues.
 */
export async function fetchMediaViaProxy(url: string): Promise<{ data: string; mimeType: string }> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch media via proxy: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  const mimeType = response.headers.get("content-type") || blob.type;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ data: reader.result as string, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
