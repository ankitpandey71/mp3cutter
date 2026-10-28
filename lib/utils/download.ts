export const baseName = (name: string): string => name.replace(/\.[^/.]+$/, "");

/** Triggers a browser download for an in-memory Blob. */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
