'use client';

import { useState } from 'react';

export function CreatorMark() {
    const [open, setOpen] = useState(false);

    return <div className="fixed bottom-5 right-5 z-50">
        {open && <div className="absolute bottom-14 right-0 w-40 rounded-xl border border-line bg-white px-4 py-3 text-center text-sm font-semibold text-ink shadow-[0_12px_30px_rgba(23,33,31,.15)]" role="status">
            Made by Pratik
        </div>}
        <button
            type="button"
            aria-expanded={open}
            aria-label="Show creator information"
            title="Show creator information"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-coral focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
        >
            P
        </button>
    </div>;
}
