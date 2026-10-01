'use client';

import { FormEvent, useState } from 'react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type MediaResult = {
    title?: string;
    thumbnail?: string;
    duration?: number;
    download_url?: string;
    ext?: string;
};
type PdfPage = { page: number; text: string };

async function getError(response: Response, fallback: string) {
    try {
        const payload = await response.json() as { message?: string };
        return payload.message || fallback;
    } catch {
        return fallback;
    }
}

export default function CyberVault() {
    const [tab, setTab] = useState<'media' | 'pdf'>('media');
    const [mediaUrl, setMediaUrl] = useState('');
    const [media, setMedia] = useState<MediaResult | null>(null);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState('');
    const [mergeLoading, setMergeLoading] = useState(false);
    const [mergeError, setMergeError] = useState('');
    const [extractLoading, setExtractLoading] = useState(false);
    const [extractError, setExtractError] = useState('');
    const [pages, setPages] = useState<PdfPage[]>([]);

    const extractMedia = async (event: FormEvent) => {
        event.preventDefault();
        if (!mediaUrl.trim()) return;
        setMediaLoading(true);
        setMedia(null);
        setMediaError('');
        try {
            const response = await fetch(`${apiBase}/api/download?url=${encodeURIComponent(mediaUrl.trim())}`);
            if (!response.ok) throw new Error(await getError(response, 'Media extraction failed.'));
            const payload = await response.json() as { status: string } & MediaResult;
            if (payload.status === 'error') throw new Error('Media extraction failed.');
            setMedia(payload);
        } catch (error) {
            setMediaError(error instanceof Error ? error.message : 'Media extraction failed.');
        } finally {
            setMediaLoading(false);
        }
    };

    const mergePdfs = async (files: FileList | null) => {
        if (!files?.length) return;
        setMergeLoading(true);
        setMergeError('');
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('files', file));
        try {
            const response = await fetch(`${apiBase}/api/pdf/merge`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await getError(response, 'PDF merge failed.'));
            const link = document.createElement('a');
            link.href = URL.createObjectURL(await response.blob());
            link.download = 'merged_document.pdf';
            link.click();
            URL.revokeObjectURL(link.href);
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
        setPages([]);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${apiBase}/api/pdf/extract-text`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await getError(response, 'Text extraction failed.'));
            const payload = await response.json() as { status: string; pages?: PdfPage[] };
            if (payload.status === 'error') throw new Error('Text extraction failed.');
            setPages(payload.pages || []);
        } catch (error) {
            setExtractError(error instanceof Error ? error.message : 'Text extraction failed.');
        } finally {
            setExtractLoading(false);
        }
    };

    const extractedText = pages.map((page) => `Page ${page.page}\n${page.text}`).join('\n\n');

    return (
        <main className="min-h-screen bg-[#07111b]">
            <header className="border-b border-cyan-400/20 bg-[#091927]/90 px-6 py-5 shadow-[0_0_30px_rgba(34,211,238,.08)]">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-[.3em] text-cyan-300">CyberVault</p><h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">CyberVault OSINT &amp; Utility Suite</h1></div>
                    <span className="hidden rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300 sm:block">SYSTEM ONLINE</span>
                </div>
            </header>
            <section className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8 flex gap-2 rounded-xl border border-slate-700 bg-[#0b1a29] p-1">
                    {(['media', 'pdf'] as const).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold transition ${tab === value ? 'bg-cyan-400 text-[#04101a]' : 'text-slate-400 hover:text-white'}`}>{value === 'media' ? 'Media Downloader' : 'PDF Tools'}</button>)}
                </div>
                {tab === 'media' ? <section className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6 shadow-[0_0_40px_rgba(34,211,238,.06)] sm:p-8">
                    <h2 className="text-2xl font-bold text-white">Extract media stream</h2><p className="mt-2 text-sm text-slate-400">Resolve a public media URL into a browser-downloadable stream.</p>
                    <form onSubmit={extractMedia} className="mt-6 flex flex-col gap-3 sm:flex-row"><input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://..." className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#07111b] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300" /><button disabled={mediaLoading} className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-bold text-[#04101a] disabled:opacity-50">{mediaLoading ? 'Extracting...' : 'Extract Video'}</button></form>
                    {mediaError && <ErrorBanner message={mediaError} />}
                    {media && <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">{media.thumbnail && <img src={media.thumbnail} alt="" className="aspect-video w-full rounded-lg object-cover" />}<div><h3 className="text-xl font-bold text-white">{media.title || 'Untitled media'}</h3>{media.duration && <p className="mt-2 text-sm text-slate-400">Duration: {media.duration}s</p>}{media.download_url && <a href={media.download_url} download className="mt-6 inline-block rounded-lg bg-emerald-400 px-5 py-3 text-sm font-bold text-[#04120d]">Download Stream</a>}</div></div>}
                </section> : <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6"><h2 className="text-xl font-bold text-white">Merge PDFs</h2><p className="mt-2 text-sm text-slate-400">Select PDF files and download one merged document.</p><input type="file" accept=".pdf,application/pdf" multiple onChange={(event) => mergePdfs(event.target.files)} className="mt-6 block w-full rounded-lg border border-slate-700 bg-[#07111b] p-3 text-sm text-slate-300" />{mergeLoading && <p className="mt-4 text-sm text-cyan-300">Merging documents...</p>}{mergeError && <ErrorBanner message={mergeError} />}</section>
                    <section className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6"><h2 className="text-xl font-bold text-white">Extract text</h2><p className="mt-2 text-sm text-slate-400">Read each PDF page in a formatted viewer.</p><input type="file" accept=".pdf,application/pdf" onChange={(event) => extractText(event.target.files?.[0])} className="mt-6 block w-full rounded-lg border border-slate-700 bg-[#07111b] p-3 text-sm text-slate-300" />{extractLoading && <p className="mt-4 text-sm text-cyan-300">Extracting text...</p>}{extractError && <ErrorBanner message={extractError} />}{pages.length > 0 && <><pre className="mt-5 max-h-80 overflow-auto rounded-lg border border-slate-700 bg-[#07111b] p-4 text-xs leading-6 text-emerald-200">{extractedText}</pre><button type="button" onClick={() => navigator.clipboard.writeText(extractedText)} className="mt-4 rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/10">Copy to Clipboard</button></>}</section>
                </div>}
            </section>
        </main>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return <div role="alert" className="mt-5 rounded-lg border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{message}</div>;
}
