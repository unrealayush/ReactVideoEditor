export const download = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename.endsWith('.mp4') ? filename : `${filename}.mp4`;
    
    // Using this method instead of appending to body
    link.style.display = 'none';
    document.body.appendChild(link);
    
    try {
      link.click();
    } finally {
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    console.error("Download failed:", error);
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
