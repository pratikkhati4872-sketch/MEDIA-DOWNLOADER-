import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function compressImage(file: File, maxSizeMB = 1) { return imageCompression(file, { maxSizeMB, maxWidthOrHeight: 2400, useWebWorker: true }); }
export async function downloadZip(files: { name: string; blob: Blob }[]) { const zip = new JSZip(); files.forEach((file) => zip.file(file.name, file.blob)); saveAs(await zip.generateAsync({ type: 'blob' }), 'format-studio-exports.zip'); }
