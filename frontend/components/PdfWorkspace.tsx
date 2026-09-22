'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Download, FileText, LoaderCircle } from 'lucide-react';
import { apiUrl } from '../lib/api-url';

type ExtractedPage = { page: number; text: string };
type ApiError = { status?: string; message?: string; error?: string };

async function readError(response: Response, fallback: string) {
    try {
        const payload = await response.json() as ApiError;
        return payload.message || payload.error || fallback;
    } catch {
        return fallback;
    }
}

export function PdfWorkspace() {
    const [mergeFiles, setMergeFiles] = useState<File[]>([]);
    const [mergeLoading, setMergeLoading] = useState(false);
    const [mergeUrl, setMergeUrl] = useState('');
    const [mergeError, setMergeError] = useState('');
    const [extractLoading, setExtractLoading] = useState(false);
    const [extractPages, setExtractPages] = useState<ExtractedPage[]>([]);
    const [extractError, setExtractError] = useState('');

    const mergePdfs = async () => {
        if (!mergeFiles.length) return;
        setMergeLoading(true);
        setMergeError('');
        setMergeUrl('');
        const formData = new FormData();
        mergeFiles.forEach((file) => formData.append('files', file));
        try {
            const response = await fetch(`${apiUrl}/api/pdf/merge`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await readError(response, 'PDF merge failed.'));
            setMergeUrl(URL.createObjectURL(await response.blob()));
        } catch (error) {
            setMergeError(error instanceof Error ? error.message : 'PDF merge failed.');
        } finally {
            setMergeLoading(false);
        }
    };

    const extractText = async (file: File | undefined) => {
        if (!file) return;
        setExtractLoading(true);
        setExtractError('');
        setExtractPages([]);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${apiUrl}/api/pdf/extract-text`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await readError(response, 'Text extraction failed.'));
            const result = await response.json() as { status: string; content?: ExtractedPage[] };
            if (result.status === 'error') throw new Error('Text extraction failed.');
            setExtractPages(result.content || []);
        } catch (error) {
            setExtractError(error instanceof Error ? error.message : 'Text extraction failed.');
        } finally {
            setExtractLoading(false);
        }
    };

    return <main className="min-h-screen bg-paper px-6 py-8"><div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ink"><ArrowLeft size={15} /> Back to toolkit</Link>
        <div className="mt-16"><FileText className="text-coral" size={32} /><h1 className="mt-5 font-display text-6xl">PDF tools</h1><p className="mt-4 max-w-xl text-lg text-slate-500">Merge documents or extract searchable text without sending temporary files to disk.</p></div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(23,33,31,.05)] sm:p-8"><h2 className="text-xl font-bold text-ink">Merge PDFs</h2><p className="mt-2 text-sm text-slate-500">Choose two or more PDF files in the order they should appear.</p><input className="mt-6 block w-full rounded-xl border border-line bg-[#fbfaf7] p-3 text-sm" type="file" accept=".pdf,application/pdf" multiple onChange={(event) => { setMergeFiles(Array.from(event.target.files || [])); setMergeError(''); setMergeUrl(''); }} /><button type="button" disabled={!mergeFiles.length || mergeLoading} onClick={mergePdfs} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sidebar px-4 py-3 text-sm font-bold text-white hover:bg-moss disabled:cursor-not-allowed disabled:opacity-40">{mergeLoading && <LoaderCircle className="animate-spin" size={16} />} {mergeLoading ? 'Merging...' : 'Merge PDFs'}</button>{mergeFiles.length > 0 && <p className="mt-3 text-xs text-slate-500">{mergeFiles.length} file{mergeFiles.length === 1 ? '' : 's'} selected</p>}{mergeError && <p role="alert" className="mt-4 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{mergeError}</p>}{mergeUrl && <a href={mergeUrl} download="merged_document.pdf" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss px-4 py-3 text-sm font-bold text-white hover:bg-ink"><Download size={16} /> Download merged PDF</a>}</section>
            <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(23,33,31,.05)] sm:p-8"><h2 className="text-xl font-bold text-ink">Extract text</h2><p className="mt-2 text-sm text-slate-500">Read text page by page from a PDF document.</p><input className="mt-6 block w-full rounded-xl border border-line bg-[#fbfaf7] p-3 text-sm" type="file" accept=".pdf,application/pdf" onChange={(event) => extractText(event.target.files?.[0])} />{extractLoading && <p className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin text-moss" size={17} /> Extracting text...</p>}{extractError && <p role="alert" className="mt-4 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{extractError}</p>}{extractPages.length > 0 && <div className="mt-5 max-h-96 space-y-4 overflow-y-auto">{extractPages.map((page) => <article key={page.page} className="rounded-xl border border-line bg-[#fbfaf7] p-4"><h3 className="text-sm font-bold text-ink">Page {page.page}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{page.text || 'No text found on this page.'}</p></article>)}</div>}</section>
        </div>
    </div></main>;
}
