'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, Download, Image as ImageIcon, LoaderCircle, UploadCloud } from 'lucide-react';
import { compressImage } from '../lib/client-converters';

type OutputFormat = 'same' | 'image/jpeg' | 'image/png';

const formatName = (format: OutputFormat) => format === 'same' ? 'Original format' : format === 'image/jpeg' ? 'JPG' : 'PNG';
const formatExtension = (format: OutputFormat, originalName: string) => format === 'same' ? originalName.split('.').pop() || 'jpg' : format === 'image/jpeg' ? 'jpg' : 'png';

export function ImageCompressor() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState('');
    const [compressedUrl, setCompressedUrl] = useState('');
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [quality, setQuality] = useState(80);
    const [format, setFormat] = useState<OutputFormat>('same');
    const [working, setWorking] = useState(false);
    const [error, setError] = useState('');

    const processFile = async (nextFile: File, nextQuality = quality, nextFormat = format) => {
        if (!nextFile.type.match(/^image\/(jpeg|png)$/)) {
            setError('Please choose a JPG, JPEG, or PNG image.');
            return;
        }
        if (nextFile.size > 40 * 1024 * 1024) {
            setError('Images must be 40 MB or smaller.');
            return;
        }
        setError('');
        setFile(nextFile);
        setOriginalUrl(URL.createObjectURL(nextFile));
        setWorking(true);
        try {
            const maxSize = Math.max(0.08, 1.8 - (nextQuality / 100) * 1.6);
            const output = await compressImage(nextFile, maxSize, nextQuality / 100, nextFormat === 'same' ? undefined : nextFormat);
            setCompressedFile(output);
            setCompressedUrl(URL.createObjectURL(output));
        } catch {
            setError('This image could not be compressed. Please try another file.');
        } finally {
            setWorking(false);
        }
    };

    const chooseFile = (nextFile: File | undefined) => nextFile && processFile(nextFile);
    const updateQuality = (value: number) => { setQuality(value); if (file) void processFile(file, value, format); };
    const updateFormat = (value: OutputFormat) => { setFormat(value); if (file) void processFile(file, quality, value); };
    const downloadName = file ? `${file.name.replace(/\.[^.]+$/, '')}-compressed.${formatExtension(format, file.name)}` : 'compressed-image.jpg';
    const reduction = file && compressedFile ? Math.max(0, Math.round((1 - compressedFile.size / file.size) * 100)) : 0;

    if (!file) return <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(23,33,31,.05)] sm:p-8"><div className="mb-7 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-ink">Upload an image</h2><p className="mt-1 text-sm leading-6 text-slate-500">Drag and drop your image here, or browse from your device.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e0efea] text-moss"><ImageIcon size={19} /></span></div><input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }} className="flex min-h-64 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-[#fbfaf7] px-6 py-12 text-sm text-slate-500 transition hover:border-teal hover:bg-[#f5fbf8]"><UploadCloud size={30} className="mb-4 text-moss" /><span className="font-semibold text-ink">Browse files</span><span className="mt-2 text-xs">JPG, JPEG, or PNG up to 40 MB</span></button>{error && <p role="alert" className="mt-4 rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{error}</p>}<div className="mt-6 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 size={15} className="text-teal" /> Private browser-first processing</div></div>;

    return <div className="space-y-6"><div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border border-line bg-white p-5 shadow-[0_18px_50px_rgba(23,33,31,.05)] sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-ink">Preview</p><p className="mt-1 truncate text-xs text-slate-500">{file.name}</p></div>{working ? <LoaderCircle className="animate-spin text-moss" size={19} /> : <span className="rounded-full bg-[#edf8f0] px-3 py-1 text-xs font-bold text-moss">{reduction}% smaller</span>}</div><div className="grid gap-4 sm:grid-cols-2"><div><div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-[.12em] text-slate-400"><span>Original</span><span>{(file.size / 1024 / 1024).toFixed(2)} MB</span></div><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-[#f0eee7]"><img src={originalUrl} alt="Original image" className="max-h-full max-w-full object-contain" /></div></div><div><div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-[.12em] text-slate-400"><span>Compressed</span><span>{compressedFile ? `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Processing'}</span></div><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl bg-[#f0eee7]">{compressedUrl ? <img src={compressedUrl} alt="Compressed image" className="max-h-full max-w-full object-contain" /> : <LoaderCircle className="animate-spin text-moss" size={24} />}</div></div></div></div><aside className="rounded-2xl border border-line bg-[#f0eee7] p-6 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-ink">Compression</p><p className="mt-1 text-xs text-slate-500">Fine-tune the quality and size.</p></div><span className="text-lg font-bold text-moss">{quality}%</span></div><label htmlFor="quality" className="sr-only">Image quality</label><input id="quality" type="range" min="20" max="100" value={quality} onChange={(event) => updateQuality(Number(event.target.value))} className="mt-7 w-full accent-[#456b5b]" /><div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>Smaller file</span><span>Higher quality</span></div><p className="mt-8 text-xs font-bold uppercase tracking-[.14em] text-slate-500">Output format</p><div className="mt-3 grid grid-cols-3 gap-2">{(['same', 'image/jpeg', 'image/png'] as OutputFormat[]).map((option) => <button type="button" key={option} onClick={() => updateFormat(option)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold transition ${format === option ? 'border-moss bg-moss text-white' : 'border-line bg-white text-slate-500 hover:border-moss'}`}>{formatName(option)}</button>)}</div>{compressedUrl && <a href={compressedUrl} download={downloadName} className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-sidebar px-4 py-3.5 text-sm font-bold text-white transition hover:bg-moss"><Download size={16} /> Download image</a>}<button type="button" onClick={() => { setFile(null); setCompressedFile(null); setOriginalUrl(''); setCompressedUrl(''); setError(''); }} className="mt-3 w-full text-xs font-semibold text-slate-500 hover:text-ink">Choose another image</button></aside></div>{error && <p role="alert" className="rounded-xl border border-[#e8bdb4] bg-[#fff3f0] px-4 py-3 text-sm text-[#a54638]">{error}</p>}</div>;
}