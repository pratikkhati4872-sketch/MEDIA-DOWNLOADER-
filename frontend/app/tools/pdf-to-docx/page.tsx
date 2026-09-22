'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, FileText, Home, LoaderCircle } from 'lucide-react';
import { FileUploader } from '../../../components/FileUploader';
import { apiUrl } from '../../../lib/api-url';

export default function PdfToDocx() {
    const [status, setStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [filename, setFilename] = useState('converted-document.docx');
    const [error, setError] = useState('');

    const convertPdf = async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        setStatus('converting');
        setError('');
        setDownloadUrl('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${apiUrl}/api/pdf/to-docx`, { method: 'POST', body: formData });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'PDF conversion failed.');
            }
            const blob = await response.blob();
            setDownloadUrl(URL.createObjectURL(blob));
            setFilename(`${file.name.replace(/\.pdf$/i, '')}.docx`);
            setStatus('success');
        } catch (conversionError) {
            setError(conversionError instanceof Error ? conversionError.message : 'Unable to convert this PDF.');
            setStatus('error');
        }
    };

    return <main className="min-h-screen bg-paper px-6 py-8"><div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-ink"><ArrowLeft size={15} /> Back to toolkit</Link><Link href="/" aria-label="Go home" title="Home" className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss"><Home size={15} /> Home</Link></div>
        <div className="mt-16"><FileText className="text-coral" size={32} /><h1 className="mt-5 font-display text-6xl">PDF to DOCX</h1><p className="mt-4 max-w-xl text-lg text-slate-500">Turn locked layouts into editable documents while keeping the structure close to the original.</p>
            <div className="mt-10"><FileUploader accept="application/pdf" multiple={false} onFiles={convertPdf} /></div>
            {status === 'converting' && <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-slate-600"><LoaderCircle className="animate-spin text-moss" size={17} /> Converting your PDF...</div>}
            {status === 'success' && <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-[#b9d9c9] bg-[#edf8f0] px-4 py-3 text-sm text-moss"><span className="flex items-center gap-2"><CheckCircle2 size={17} /> Your DOCX is ready.</span><a href={downloadUrl} download={filename} className="inline-flex items-center gap-2 rounded-lg bg-moss px-3 py-2 font-semibold text-white transition hover:bg-ink"><Download size={15} /> Download</a></div>}
            {status === 'error' && <p role="alert" className="mt-5 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{error}</p>}
        </div>
    </div></main>;
}
