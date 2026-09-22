'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Download, Layers3, LoaderCircle } from 'lucide-react';
import { FileUploader } from '../../../components/FileUploader';
import { apiUrl } from '../../../lib/api-url';

export default function BatchConverter() {
    const [files, setFiles] = useState<File[]>([]);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [working, setWorking] = useState(false);
    const [error, setError] = useState('');

    const createArchive = async (selectedFiles: File[]) => {
        const queue = selectedFiles.slice(0, 20);
        if (!queue.length) return;
        setFiles(queue);
        setWorking(true);
        setError('');
        setDownloadUrl('');
        const formData = new FormData();
        queue.forEach((file) => formData.append('files', file));
        try {
            const response = await fetch(`${apiUrl}/api/batch/zip`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error((await response.text()) || 'Batch export failed.');
            setDownloadUrl(URL.createObjectURL(await response.blob()));
        } catch (conversionError) {
            setError(conversionError instanceof Error ? conversionError.message : 'Batch export failed.');
        } finally {
            setWorking(false);
        }
    };

    return <main className="min-h-screen bg-paper px-6 py-8"><div className="mx-auto max-w-3xl"><Link href="/" className="text-sm text-slate-500"><ArrowLeft className="mr-2 inline" size={15} /> Back to toolkit</Link><div className="mt-20"><Layers3 className="text-coral" size={32} /><h1 className="mt-5 font-display text-6xl">Batch converter</h1><p className="mt-4 text-lg text-slate-500">Drop up to 20 files and let the queue do the repetitive work.</p><div className="mt-10"><FileUploader onFiles={createArchive} /></div>{files.length > 0 && <div className="mt-5 rounded-2xl border border-line bg-white p-5"><p className="text-sm font-bold text-ink">{files.length} files queued</p><ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm text-slate-500">{files.map((file) => <li key={`${file.name}-${file.lastModified}`} className="truncate">{file.name}</li>)}</ul>{working && <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin text-moss" size={17} /> Packaging your files...</p>}{downloadUrl && <a href={downloadUrl} download="format-studio-batch.zip" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss px-4 py-3 text-sm font-bold text-white hover:bg-ink"><Download size={16} /> Download ZIP</a>}</div>}{error && <p role="alert" className="mt-5 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{error}</p>}</div></div></main>;
}
