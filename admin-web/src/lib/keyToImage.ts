const BASE_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "";

export const keyToImage = (key: string | undefined | null) => {
  if (!key) {
    return "";
  }

  // If key is already a full URL (http:// or https://), return it as-is
  if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("data:")) {
    return key;
  }

  // Remove leading slash from key if present to avoid double slashes
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  
  // Remove trailing slash from BASE_URL if present
  const cleanBaseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  
  // If BASE_URL is empty, return the key with leading slash (local path)
  if (!cleanBaseUrl) {
    return `/${cleanKey}`;
  }

  return `${cleanBaseUrl}/${cleanKey}`;
};
