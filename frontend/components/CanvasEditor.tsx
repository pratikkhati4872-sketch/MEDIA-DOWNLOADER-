'use client';
import { useEffect, useRef } from 'react';
import { Canvas, IText } from 'fabric';

export function CanvasEditor() {
    const ref = useRef<HTMLCanvasElement>(null); const canvas = useRef<Canvas | null>(null);
    useEffect(() => { if (!ref.current) return; canvas.current = new Canvas(ref.current, { backgroundColor: '#ffffff', width: 720, height: 460 }); canvas.current.add(new IText('Add a note', { left: 80, top: 80, fill: '#17211f', fontSize: 30 })); return () => { canvas.current?.dispose(); }; }, []);
    return <canvas ref={ref} className="max-w-full rounded-xl border border-line shadow-inner" />;
}
