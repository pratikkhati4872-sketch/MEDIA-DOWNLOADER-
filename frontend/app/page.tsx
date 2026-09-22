'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, Download, FileText, Image, Layers3, Link2, Menu, Search, ScanText, Settings2, Upload, WandSparkles, X } from 'lucide-react';
import { ImageCompressor } from '../components/ImageCompressor';
import { apiUrl } from '../lib/api-url';

type Tool = { name: string; category: string; description: string; icon: typeof Download; href?: string; kind: 'url' | 'file' | 'compressor' };

const tools: Tool[] = [
    { name: 'Video Downloader', category: 'MEDIA DOWNLOADERS', description: 'Save videos from a link in the format you need.', icon: Download, kind: 'url' },
    { name: 'Audio Downloader', category: 'MEDIA DOWNLOADERS', description: 'Extract a clean audio file from a media link.', icon: Download, kind: 'url' },
    { name: 'PDF to DOCX', category: 'PDF TOOLS', description: 'Turn locked layouts into editable documents.', icon: FileText, href: '/tools/pdf-to-docx', kind: 'file' },
    { name: 'OCR Extractor', category: 'PDF TOOLS', description: 'Pull clean, usable text from scans.', icon: ScanText, href: '/tools/ocr', kind: 'file' },
    { name: 'Remove Background', category: 'FILE CONVERTERS', description: 'Create transparent product cutouts with AI.', icon: WandSparkles, href: '/tools/remove-bg', kind: 'file' },
    { name: 'Image Compressor', category: 'FILE CONVERTERS', description: 'Reduce image size while balancing quality and clarity.', icon: Image, kind: 'compressor' },
    { name: 'Image Composer', category: 'FILE CONVERTERS', description: 'Layer, crop, annotate, and export images.', icon: Image, href: '/tools/image-composer', kind: 'file' },
    { name: 'Batch Converter', category: 'FILE CONVERTERS', description: 'Process up to 20 files in one queue.', icon: Layers3, href: '/tools/batch-converter', kind: 'file' },
];

const recentItems = [
    { name: 'Product launch — 1080p.mp4', detail: 'Video Downloader · Today, 10:42 AM', status: 'Ready' },
    { name: 'quarterly-report.docx', detail: 'PDF to DOCX · Yesterday, 4:18 PM', status: 'Ready' },
];

export default function Home() {
    const [activeTool, setActiveTool] = useState('Video Downloader');
    const [query, setQuery] = useState('');
    const [url, setUrl] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
    const [downloadUrl, setDownloadUrl] = useState('');
    const [downloadName, setDownloadName] = useState('format-studio-download');
    const [downloadError, setDownloadError] = useState('');
    const selectedTool = tools.find((tool) => tool.name === activeTool) ?? tools[0];
    const visibleTools = useMemo(() => tools.filter((tool) => tool.name.toLowerCase().includes(query.toLowerCase()) || tool.category.toLowerCase().includes(query.toLowerCase())), [query]);
    const categories = Array.from(new Set(visibleTools.map((tool) => tool.category)));

    const downloadMedia = async () => {
        if (!url.trim()) return;
        setDownloadState('downloading');
        setDownloadError('');
        setDownloadUrl('');
        try {
            const response = await fetch(`${apiUrl}/api/downloads/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim(), kind: activeTool === 'Audio Downloader' ? 'audio' : 'video' }),
            });
            if (!response.ok) throw new Error((await response.text()) || 'The media download failed.');
            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition');
            const serverName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
            setDownloadUrl(URL.createObjectURL(blob));
            setDownloadName(serverName || `format-studio-${activeTool === 'Audio Downloader' ? 'audio' : 'video'}`);
            setDownloadState('success');
        } catch (error) {
            setDownloadError(error instanceof Error ? error.message : 'The media download failed.');
            setDownloadState('error');
        }
    };

    return <main className="workspace-shell min-h-screen lg:flex">
        <aside className={`${menuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[286px] shrink-0 flex-col bg-sidebar px-5 py-6 text-white transition-transform duration-300 lg:relative lg:translate-x-0`}>
            <div className="flex items-center justify-between px-2"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-[15px] font-bold text-sidebar">P</span><span className="text-lg font-bold tracking-tight">format<span className="text-teal">.</span></span></div><button type="button" aria-label="Close navigation" className="text-white/50 lg:hidden" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
            <div className="relative mt-10"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} /><input aria-label="Search tools" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools" className="w-full rounded-xl border border-white/10 bg-white/[.07] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-teal" /></div>
            <nav className="mt-8 flex-1 overflow-y-auto">{categories.map((category) => <div key={category} className="mb-7"><p className="mb-3 px-3 text-[10px] font-bold tracking-[.18em] text-white/35">{category}</p><div className="space-y-1">{visibleTools.filter((tool) => tool.category === category).map((tool) => { const Icon = tool.icon; const isActive = activeTool === tool.name; return <button type="button" key={tool.name} onClick={() => { setActiveTool(tool.name); setMenuOpen(false); }} className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/[.06] hover:text-white'}`}><span className={`absolute -left-5 h-7 w-1 rounded-r-full bg-teal transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} /><Icon size={17} strokeWidth={1.8} /><span>{tool.name}</span>{isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal" />}</button>; })}</div></div>)}</nav>
            <div className="border-t border-white/10 pt-5"><button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55 hover:bg-white/[.06] hover:text-white"><Settings2 size={17} /> Preferences</button><p className="mt-6 px-3 text-xs text-white/25">format studio / 2026</p></div>
        </aside>
        {menuOpen && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-sidebar/60 lg:hidden" onClick={() => setMenuOpen(false)} />}
        <section className="min-w-0 flex-1 bg-workspace"><header className="flex items-center justify-between border-b border-line px-6 py-5 lg:px-12"><button type="button" aria-label="Open navigation" className="text-ink lg:hidden" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div className="hidden text-sm text-slate-500 sm:block">Workspace <span className="mx-2 text-slate-300">/</span> {selectedTool.name}</div><div className="ml-auto flex items-center gap-3 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-teal" /> Processing stays private</div></header>
            <div className="mx-auto max-w-5xl px-6 py-10 lg:px-12 lg:py-14"><div className="mb-10"><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-coral"><span className="h-1.5 w-1.5 rounded-full bg-coral" /> Selected tool</p><div className="flex items-start justify-between gap-5"><div><h1 className="font-display text-4xl text-ink sm:text-5xl">{selectedTool.name}</h1><p className="mt-3 max-w-xl text-base leading-7 text-slate-500">{selectedTool.description}</p></div><span className="hidden rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 sm:block">{selectedTool.category.toLowerCase()}</span></div></div>
                <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">{selectedTool.kind === 'url' ? <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(23,33,31,.05)] sm:p-8"><div className="mb-8 flex items-center justify-between"><div><h2 className="text-lg font-bold text-ink">Paste a {activeTool === 'Audio Downloader' ? 'media' : 'video'} URL</h2><p className="mt-1 text-sm text-slate-500">Works with the link copied from your browser.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e0efea] text-moss"><Link2 size={19} /></span></div><label htmlFor="media-url" className="mb-2 block text-xs font-bold uppercase tracking-[.14em] text-slate-500">Media link</label><div className="flex flex-col gap-3 sm:flex-row"><input id="media-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." className="min-w-0 flex-1 rounded-xl border border-line bg-[#fbfaf7] px-4 py-3.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20" /><button type="button" onClick={downloadMedia} disabled={!url.trim() || downloadState === 'downloading'} className="flex items-center justify-center gap-2 rounded-xl bg-sidebar px-5 py-3.5 text-sm font-bold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-40">{downloadState === 'downloading' ? 'Downloading...' : 'Download'} <ArrowRight size={16} /></button></div>{downloadState === 'success' && <a href={downloadUrl} download={downloadName} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss px-4 py-3 text-sm font-bold text-white transition hover:bg-ink">Download ready <Download size={16} /></a>}{downloadState === 'error' && <p role="alert" className="mt-5 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{downloadError}</p>}<div className="mt-7 flex items-center gap-2 border-t border-line pt-5 text-xs text-slate-400"><CheckCircle2 size={15} className="text-teal" /> No account required. Your link is only used for this download.</div></div> : selectedTool.kind === 'compressor' ? <ImageCompressor /> : <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(23,33,31,.05)] sm:p-8"><div className="mb-8 flex items-center justify-between"><div><h2 className="text-lg font-bold text-ink">{selectedTool.name} is ready in its dedicated workspace</h2><p className="mt-1 text-sm text-slate-500">Open the tool to upload a file and see progress, validation, and the finished result.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e0efea] text-moss"><Upload size={19} /></span></div><Link href={selectedTool.href ?? '/'} className="inline-flex items-center gap-2 rounded-xl bg-sidebar px-5 py-3.5 text-sm font-bold text-white transition hover:bg-moss">Open {selectedTool.name} <ArrowRight size={16} /></Link></div>}
                    <aside className="rounded-2xl border border-line bg-[#f0eee7] p-6 sm:p-7"><div className="flex items-center justify-between"><h2 className="text-lg font-bold text-ink">Recent activity</h2><Clock3 size={18} className="text-slate-400" /></div><div className="mt-6 space-y-4">{recentItems.map((item) => <div key={item.name} className="flex items-start gap-3 border-b border-[#d9d8d0] pb-4 last:border-0 last:pb-0"><div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-moss"><FileText size={15} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{item.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p><span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-moss"><CheckCircle2 size={12} /> {item.status}</span></div></div>)}</div>{selectedTool.href && <Link href={selectedTool.href} className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-sidebar px-4 py-3 text-xs font-bold text-white transition hover:bg-moss">Open {selectedTool.name} <ArrowRight size={14} /></Link>}<button type="button" className="mt-4 flex items-center gap-2 text-xs font-bold text-ink hover:text-moss">View all activity <ArrowRight size={14} /></button></aside>
                </div><div className="mt-9 flex items-center gap-2 text-xs text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-teal" /> Ready when you are <span className="mx-1 text-slate-300">·</span> One tool at a time, no page refreshes.</div>
            </div></section>
    </main>;
}
