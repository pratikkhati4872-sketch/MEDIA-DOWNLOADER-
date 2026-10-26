'use client';

import { FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

type MediaResult = {
    title?: string;
    thumbnail?: string;
    duration?: number;
    download_url?: string;
    ext?: string;
};
type PdfPage = { page: number; text: string };
type MediaHistoryItem = MediaResult & { sourceUrl: string; createdAt: number };
type HealthStatus = { loading: boolean; error: string; ok: boolean | null };

async function getError(response: Response, fallback: string) {
    try {
        const payload = await response.json() as { message?: string };
        return payload.message || fallback;
    } catch {
        return fallback;
    }
}

export default function CyberVault() {
    const [tab, setTab] = useState<'dashboard' | 'media' | 'pdf'>('dashboard');
    const [mediaUrl, setMediaUrl] = useState('');
    const [media, setMedia] = useState<MediaResult | null>(null);
    const [mediaHistory, setMediaHistory] = useState<MediaHistoryItem[]>([]);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState('');
    const [mediaMessage, setMediaMessage] = useState('');
    const [mergeLoading, setMergeLoading] = useState(false);
    const [mergeError, setMergeError] = useState('');
    const [mergeMessage, setMergeMessage] = useState('');
    const [extractLoading, setExtractLoading] = useState(false);
    const [extractError, setExtractError] = useState('');
    const [extractMessage, setExtractMessage] = useState('');
    const [pdfSearch, setPdfSearch] = useState('');
    const [health, setHealth] = useState<HealthStatus>({ loading: false, error: '', ok: null });
    const [pages, setPages] = useState<PdfPage[]>([]);
    const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

    const quickUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://vimeo.com/channels/staffpicks',
        'https://soundcloud.com/discover',
    ];

    const extractMedia = async (event: FormEvent) => {
        event.preventDefault();
        if (!mediaUrl.trim()) return;
        setMediaLoading(true);
        setMedia(null);
        setMediaError('');
        setMediaMessage('');
        try {
            const response = await fetch(`${apiBase}/api/download?url=${encodeURIComponent(mediaUrl.trim())}`);
            if (!response.ok) throw new Error(await getError(response, 'Media extraction failed.'));
            const payload = await response.json() as { status: string } & MediaResult;
            if (payload.status === 'error') throw new Error('Media extraction failed.');
            setMedia(payload);
            setMediaHistory((previous) => [{ ...payload, sourceUrl: mediaUrl.trim(), createdAt: Date.now() }, ...previous].slice(0, 6));
            setMediaMessage('Media stream extracted successfully.');
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
        setMergeMessage('');
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
            setMergeMessage('Merged PDF downloaded.');
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
        setExtractMessage('');
        setPages([]);
        setPdfSearch('');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`${apiBase}/api/pdf/extract-text`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error(await getError(response, 'Text extraction failed.'));
            const payload = await response.json() as { status: string; pages?: PdfPage[] };
            if (payload.status === 'error') throw new Error('Text extraction failed.');
            setPages(payload.pages || []);
            setExtractMessage('PDF text extracted.');
        } catch (error) {
            setExtractError(error instanceof Error ? error.message : 'Text extraction failed.');
        } finally {
            setExtractLoading(false);
        }
    };

    const filteredPages = useMemo(() => {
        if (!pdfSearch.trim()) return pages;
        const query = pdfSearch.toLowerCase();
        return pages.filter((page) => page.text.toLowerCase().includes(query) || `${page.page}`.includes(query));
    }, [pages, pdfSearch]);
    const extractedText = filteredPages.map((page) => `Page ${page.page}\n${page.text}`).join('\n\n');
    const totalCharacters = pages.reduce((total, page) => total + page.text.length, 0);

    const checkHealth = async () => {
        setHealth({ loading: true, error: '', ok: null });
        try {
            const response = await fetch(`${apiBase}/health`);
            if (!response.ok) throw new Error('Health check failed.');
            const payload = await response.json() as { status?: string };
            setHealth({ loading: false, error: '', ok: payload.status === 'ok' });
            setLastCheckedAt(Date.now());
        } catch (error) {
            setHealth({ loading: false, error: error instanceof Error ? error.message : 'Health check failed.', ok: false });
            setLastCheckedAt(Date.now());
        }
    };

    const copyText = async (value: string, setMessage: (message: string) => void, setError: (message: string) => void) => {
        try {
            await navigator.clipboard.writeText(value);
            setMessage('Copied to clipboard.');
            setError('');
        } catch {
            setError('Clipboard access was denied by the browser.');
        }
    };

    const downloadExtractedText = () => {
        if (!extractedText) return;
        const blob = new Blob([extractedText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'extracted-text.txt';
        link.click();
        URL.revokeObjectURL(link.href);
        setExtractMessage('Text file downloaded.');
    };

    const formatDuration = (duration?: number) => {
        if (!duration) return 'Unknown duration';
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}m ${seconds}s`;
    };

    return (
        <main className="min-h-screen bg-[#07111b]">
            <header className="border-b border-cyan-400/20 bg-[#091927]/90 px-6 py-5 shadow-[0_0_30px_rgba(34,211,238,.08)]">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-[.3em] text-cyan-300">CyberVault</p><h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">Media &amp; PDF Studio</h1></div>
                    <span className="hidden rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300 sm:block">SYSTEM ONLINE</span>
                </div>
            </header>
            <section className="mx-auto max-w-6xl px-6 py-10">
                <div className="mb-8 flex gap-2 rounded-xl border border-slate-700 bg-[#0b1a29] p-1">
                    {(['dashboard', 'media', 'pdf'] as const).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold transition ${tab === value ? 'bg-cyan-400 text-[#04101a]' : 'text-slate-400 hover:text-white'}`}>{value === 'dashboard' ? 'Dashboard' : value === 'media' ? 'Media Downloader' : 'PDF Tools'}</button>)}
                </div>
                {tab === 'dashboard' && <section className="grid gap-6 lg:grid-cols-3">
                    <article className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6">
                        <p className="text-xs uppercase tracking-[.2em] text-cyan-300">Media Jobs</p>
                        <p className="mt-2 text-3xl font-bold text-white">{mediaHistory.length}</p>
                        <p className="mt-2 text-sm text-slate-400">Recent extracted streams ready for quick download.</p>
                    </article>
                    <article className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6">
                        <p className="text-xs uppercase tracking-[.2em] text-cyan-300">PDF Pages</p>
                        <p className="mt-2 text-3xl font-bold text-white">{pages.length}</p>
                        <p className="mt-2 text-sm text-slate-400">Currently loaded pages in the text viewer.</p>
                    </article>
                    <article className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6">
                        <p className="text-xs uppercase tracking-[.2em] text-cyan-300">API Status</p>
                        <button type="button" onClick={checkHealth} disabled={health.loading} className="mt-3 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-[#04101a] disabled:opacity-50">{health.loading ? 'Checking...' : 'Run Health Check'}</button>
                        <p className="mt-3 text-sm text-slate-300">{health.ok === null ? 'Not checked yet.' : health.ok ? 'Backend is healthy.' : 'Backend health check failed.'}</p>
                        {health.error && <ErrorBanner message={health.error} />}
                        {lastCheckedAt && <p className="mt-2 text-xs text-slate-500">Last checked: {new Date(lastCheckedAt).toLocaleString()}</p>}
                    </article>
                </section>}
                {tab === 'media' && <section className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6 shadow-[0_0_40px_rgba(34,211,238,.06)] sm:p-8">
                    <h2 className="text-2xl font-bold text-white">Extract media stream</h2><p className="mt-2 text-sm text-slate-400">Resolve a public media URL into browser-downloadable output.</p>
                    <div className="mt-4 flex flex-wrap gap-2">{quickUrls.map((url) => <button key={url} type="button" onClick={() => setMediaUrl(url)} className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:border-cyan-300 hover:text-cyan-200">Use sample URL</button>)}</div>
                    <form onSubmit={extractMedia} className="mt-6 flex flex-col gap-3 sm:flex-row"><input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://..." className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#07111b] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300" /><button disabled={mediaLoading} className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-bold text-[#04101a] disabled:opacity-50">{mediaLoading ? 'Extracting...' : 'Extract Video'}</button></form>
                    {mediaMessage && <SuccessBanner message={mediaMessage} />}
                    {mediaError && <ErrorBanner message={mediaError} />}
                    {media && <div className="mt-8 grid gap-6 rounded-xl border border-slate-700 bg-[#07111b] p-5 md:grid-cols-[220px_1fr]">{media.thumbnail && <Image src={media.thumbnail} alt={`${media.title || 'Media'} thumbnail`} width={220} height={124} unoptimized className="aspect-video w-full rounded-lg object-cover" />}<div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold text-white">{media.title || 'Untitled media'}</h3>{media.ext && <span className="rounded-full border border-cyan-400/30 px-2 py-1 text-xs uppercase text-cyan-300">{media.ext}</span>}</div><p className="mt-2 text-sm text-slate-400">Duration: {formatDuration(media.duration)}</p><div className="mt-5 flex flex-wrap gap-2">{media.download_url && <a href={media.download_url} download className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-[#04120d]">Download Stream</a>}{media.download_url && <button type="button" onClick={() => copyText(media.download_url || '', setMediaMessage, setMediaError)} className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400/10">Copy Stream URL</button>}{media.download_url && <a href={media.download_url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-slate-300 hover:text-white">Open Stream</a>}</div></div></div>}
                    <div className="mt-8 rounded-xl border border-slate-700 bg-[#07111b] p-5">
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-[.15em] text-slate-300">Recent Media Jobs</h3><button type="button" onClick={() => setMediaHistory([])} className="text-xs text-slate-500 hover:text-slate-300">Clear</button></div>
                        {mediaHistory.length === 0 ? <p className="text-sm text-slate-500">No jobs yet.</p> : <ul className="space-y-3">{mediaHistory.map((item) => <li key={item.createdAt} className="rounded-lg border border-slate-700 p-3"><p className="text-sm font-semibold text-white">{item.title || 'Untitled media'}</p><p className="mt-1 truncate text-xs text-slate-400">{item.sourceUrl}</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => setMediaUrl(item.sourceUrl)} className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:text-white">Reuse URL</button>{item.download_url && <button type="button" onClick={() => copyText(item.download_url || '', setMediaMessage, setMediaError)} className="rounded border border-cyan-400/40 px-2 py-1 text-xs text-cyan-200">Copy Link</button>}</div></li>)}</ul>}
                    </div>
                </section>}
                {tab === 'pdf' && <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6"><h2 className="text-xl font-bold text-white">Merge PDFs</h2><p className="mt-2 text-sm text-slate-400">Select PDF files and download one merged document.</p><input type="file" accept=".pdf,application/pdf" multiple onChange={(event) => mergePdfs(event.target.files)} className="mt-6 block w-full rounded-lg border border-slate-700 bg-[#07111b] p-3 text-sm text-slate-300" />{mergeLoading && <p className="mt-4 text-sm text-cyan-300">Merging documents...</p>}{mergeMessage && <SuccessBanner message={mergeMessage} />}{mergeError && <ErrorBanner message={mergeError} />}</section>
                    <section className="rounded-2xl border border-cyan-400/20 bg-[#0b1a29] p-6"><h2 className="text-xl font-bold text-white">Extract text</h2><p className="mt-2 text-sm text-slate-400">Read each PDF page in a searchable viewer.</p><input type="file" accept=".pdf,application/pdf" onChange={(event) => extractText(event.target.files?.[0])} className="mt-6 block w-full rounded-lg border border-slate-700 bg-[#07111b] p-3 text-sm text-slate-300" />{extractLoading && <p className="mt-4 text-sm text-cyan-300">Extracting text...</p>}{extractMessage && <SuccessBanner message={extractMessage} />}{extractError && <ErrorBanner message={extractError} />}{pages.length > 0 && <><div className="mt-4 grid gap-2 sm:grid-cols-3"><StatCard label="Pages" value={`${pages.length}`} /><StatCard label="Characters" value={`${totalCharacters}`} /><StatCard label="Filtered" value={`${filteredPages.length}`} /></div><input value={pdfSearch} onChange={(event) => setPdfSearch(event.target.value)} placeholder="Search page number or text" className="mt-4 block w-full rounded-lg border border-slate-700 bg-[#07111b] px-3 py-2 text-sm text-slate-200" /><pre className="mt-5 max-h-80 overflow-auto rounded-lg border border-slate-700 bg-[#07111b] p-4 text-xs leading-6 text-emerald-200">{extractedText || 'No pages match your search.'}</pre><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => copyText(extractedText, setExtractMessage, setExtractError)} disabled={!extractedText} className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-200 disabled:opacity-50 hover:bg-cyan-400/10">Copy to Clipboard</button><button type="button" onClick={downloadExtractedText} disabled={!extractedText} className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50">Download TXT</button><button type="button" onClick={() => { setPages([]); setPdfSearch(''); }} className="rounded-lg border border-red-400/40 px-4 py-2 text-sm font-bold text-red-200">Clear</button></div></>}</section>
                </div>}
            </section>
        </main>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return <div role="alert" className="mt-5 rounded-lg border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">{message}</div>;
}

function SuccessBanner({ message }: { message: string }) {
    return <div role="status" className="mt-5 rounded-lg border border-emerald-400/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{message}</div>;
}

function StatCard({ label, value }: { label: string; value: string }) {
    return <div className="rounded-lg border border-slate-700 bg-[#07111b] p-3"><p className="text-xs uppercase tracking-[.14em] text-slate-400">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p></div>;
}
