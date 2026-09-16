'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, Clipboard, Download, LoaderCircle, ScanText } from 'lucide-react';
import { FileUploader } from '../../../components/FileUploader';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function Ocr() {
    const [text, setText] = useState('');
    const [filename, setFilename] = useState('extracted-text.txt');
    const [working, setWorking] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const extractText = async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        setWorking(true);
        setError('');
        setText('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${apiUrl}/api/pdf/ocr`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error((await response.text()) || 'OCR extraction failed.');
            const result = await response.json() as { text?: string };
            setText(result.text?.trim() || 'No text was detected in this file.');
            setFilename(`${file.name.replace(/\.[^.]+$/, '')}.txt`);
        } catch (conversionError) {
            setError(conversionError instanceof Error ? conversionError.message : 'OCR extraction failed.');
        } finally {
            setWorking(false);
        }
    };

    const copyText = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return <main className="min-h-screen bg-paper px-6 py-8"><div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-slate-500"><ArrowLeft className="mr-2 inline" size={15} /> Back to toolkit</Link>
        <div className="mt-20"><ScanText className="text-coral" size={32} /><h1 className="mt-5 font-display text-6xl">OCR extractor</h1><p className="mt-4 text-lg text-slate-500">Make scanned pages searchable and editable.</p>
            <div className="mt-10">{working ? <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-10 text-sm text-slate-600"><LoaderCircle className="animate-spin text-moss" size={20} /> Reading your document...</div> : <FileUploader accept="image/*,application/pdf" multiple={false} onFiles={extractText} />}</div>
            {error && <p role="alert" className="mt-5 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{error}</p>}
            {text && <section className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_rgba(23,33,31,.05)]"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-ink">Extracted text</h2><p className="mt-1 text-xs text-slate-500">Review or copy the result before downloading.</p></div><div className="flex gap-2"><button type="button" onClick={copyText} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:border-moss">{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? 'Copied' : 'Copy'}</button><a href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`} download={filename} className="inline-flex items-center gap-2 rounded-lg bg-moss px-3 py-2 text-xs font-bold text-white hover:bg-ink"><Download size={14} /> Download</a></div></div><textarea value={text} onChange={(event) => setText(event.target.value)} aria-label="Extracted text" className="mt-5 min-h-72 w-full resize-y rounded-xl border border-line bg-[#fbfaf7] p-4 text-sm leading-6 text-ink outline-none focus:border-teal" /></section>}
        </div>
    </div></main>;
}
