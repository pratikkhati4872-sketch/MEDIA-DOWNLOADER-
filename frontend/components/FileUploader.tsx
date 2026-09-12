'use client';
import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export function FileUploader({ accept, multiple = true, onFiles }: { accept?: string; multiple?: boolean; onFiles: (files: File[]) => void }) {
    const inputRef = useRef<HTMLInputElement>(null); const [active, setActive] = useState(false);
    const pick = (files: FileList | null) => files && onFiles(Array.from(files));
    return <div className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${active ? 'border-coral bg-orange-50' : 'border-line bg-white/60'}`} onDragOver={(e) => { e.preventDefault(); setActive(true); }} onDragLeave={() => setActive(false)} onDrop={(e) => { e.preventDefault(); setActive(false); pick(e.dataTransfer.files); }}>
        <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple} onChange={(e) => pick(e.target.files)} />
        <UploadCloud className="mx-auto mb-4 text-moss" size={32} strokeWidth={1.5} />
        <p className="font-semibold">Drop files here</p><p className="mt-1 text-sm text-slate-500">or choose from your device</p>
        <button className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-moss" onClick={() => inputRef.current?.click()}>Choose files</button>
    </div>;
}
