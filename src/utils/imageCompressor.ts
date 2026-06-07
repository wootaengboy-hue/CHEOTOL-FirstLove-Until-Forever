/**
 * Utility to compress and resize an image on the browser side using the HTML5 Canvas API.
 * - Maximum horizontal width: 1200px
 * - Compression Quality: 75% (0.75) as JPEG
 */
export async function compressImage(file: File): Promise<File> {
  // Return the original file if it's not an image
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Custom requirements: Max width of 1200px
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          const ratio = MAX_WIDTH / width;
          width = MAX_WIDTH;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback if canvas context is not acquired
          resolve(file);
          return;
        }

        // Fill background with white (helps avoid black background when transparent PNG is converted to JPEG)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // Draw original image resized to target dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 75% quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Convert Blob back to a File to preserve file path metadata and name
              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const compressedFile = new File([blob], `${nameWithoutExt}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.75
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
