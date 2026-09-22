'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Download, LoaderCircle, WandSparkles } from 'lucide-react';
import { FileUploader } from '../../../components/FileUploader';
import { apiUrl } from '../../../lib/api-url';

export default function RemoveBg() {
    const [previewUrl, setPreviewUrl] = useState('');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [working, setWorking] = useState(false);
    const [error, setError] = useState('');

    const removeBackground = async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        setWorking(true);
        setError('');
        setDownloadUrl('');
        setPreviewUrl('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${apiUrl}/api/image/remove-background`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error((await response.text()) || 'Background removal failed.');
            const url = URL.createObjectURL(await response.blob());
            setPreviewUrl(url);
            setDownloadUrl(url);
        } catch (conversionError) {
            setError(conversionError instanceof Error ? conversionError.message : 'Background removal failed.');
        } finally {
            setWorking(false);
        }
    };

    return <main className="min-h-screen bg-paper px-6 py-8"><div className="mx-auto max-w-3xl"><Link href="/" className="text-sm text-slate-500"><ArrowLeft className="mr-2 inline" size={15} /> Back to toolkit</Link><div className="mt-20"><WandSparkles className="text-coral" size={32} /><h1 className="mt-5 font-display text-6xl">Remove background</h1><p className="mt-4 text-lg text-slate-500">Clean cutouts in a click, with transparent, white, or custom backgrounds.</p><div className="mt-10">{working ? <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-10 text-sm text-slate-600"><LoaderCircle className="animate-spin text-moss" size={20} /> Creating your transparent cutout...</div> : <FileUploader accept="image/png,image/jpeg,image/webp" multiple={false} onFiles={removeBackground} />}</div>{error && <p role="alert" className="mt-5 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{error}</p>}{previewUrl && <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_rgba(23,33,31,.05)]"><div className="grid min-h-72 place-items-center rounded-xl p-6" style={{ backgroundImage: 'linear-gradient(45deg, #f0eee7 25%, transparent 25%), linear-gradient(-45deg, #f0eee7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0eee7 75%), linear-gradient(-45deg, transparent 75%, #f0eee7 75%)', backgroundSize: '24px 24px', backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0' }}><img src={previewUrl} alt="Background removed preview" className="max-h-[28rem] max-w-full object-contain" /></div><a href={downloadUrl} download="cutout.png" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss px-4 py-3 text-sm font-bold text-white hover:bg-ink"><Download size={16} /> Download transparent PNG</a></section>}</div></div></main>;
}
