import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui';

const LLMS_TXT_URL = 'https://toyoshima.work/llms.txt';

function getMarkdownUrlForPath(pathname: string): string {
    const trimmed = pathname.replace(/\/+$/, '');
    if (trimmed === '' || trimmed === '/') return '/index.md';
    return `${trimmed}.md`;
}

type ToastState = { kind: 'idle' } | { kind: 'success'; message: string } | { kind: 'error'; message: string };

export function MarkdownActions() {
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState<ToastState>({ kind: 'idle' });
    const containerRef = useRef<HTMLDivElement>(null);
    const toastTimerRef = useRef<number | null>(null);

    const showToast = useCallback((state: Exclude<ToastState, { kind: 'idle' }>) => {
        setToast(state);
        if (toastTimerRef.current !== null) {
            window.clearTimeout(toastTimerRef.current);
        }
        toastTimerRef.current = window.setTimeout(() => {
            setToast({ kind: 'idle' });
            toastTimerRef.current = null;
        }, 2000);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    useEffect(() => () => {
        if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    }, []);

    const handleView = useCallback(() => {
        const url = getMarkdownUrlForPath(window.location.pathname);
        window.location.href = url;
    }, []);

    const handleCopyMarkdown = useCallback(async () => {
        const url = getMarkdownUrlForPath(window.location.pathname);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            await navigator.clipboard.writeText(text);
            showToast({ kind: 'success', message: 'Copied as Markdown' });
            setOpen(false);
        } catch (err) {
            showToast({ kind: 'error', message: 'Copy failed' });
        }
    }, [showToast]);

    const handleCopyLlmsUrl = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(LLMS_TXT_URL);
            showToast({ kind: 'success', message: 'Copied llms.txt URL' });
            setOpen(false);
        } catch {
            showToast({ kind: 'error', message: 'Copy failed' });
        }
    }, [showToast]);

    return (
        <div
            ref={containerRef}
            className="fixed bottom-6 right-6 z-50 font-mono text-xs"
            data-md-actions
        >
            {toast.kind !== 'idle' ? (
                <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                        'absolute bottom-full right-0 mb-3 px-3 py-2 border whitespace-nowrap uppercase tracking-widest text-2xs',
                        toast.kind === 'success'
                            ? 'bg-yellow-400 text-black border-yellow-400'
                            : 'bg-red-500 text-white border-red-500',
                    )}
                >
                    {toast.message}
                </div>
            ) : null}

            {open ? (
                <div
                    role="menu"
                    aria-label="Markdown actions"
                    className="absolute bottom-full right-0 mb-3 min-w-[220px] bg-neutral-950 border border-neutral-800 shadow-2xl"
                >
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 bg-neutral-900/60">
                        <span className="text-3xs uppercase tracking-[0.25em] text-neutral-500">
                            AI_Export
                        </span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-neutral-700" />
                            <span className="w-1.5 h-1.5 bg-neutral-700" />
                            <span className="w-1.5 h-1.5 bg-yellow-400" />
                        </div>
                    </div>
                    <Button
                        variant="menu"
                        size="sm"
                        role="menuitem"
                        onClick={handleView}
                        className="border-b border-neutral-900"
                    >
                        View as Markdown
                    </Button>
                    <Button
                        variant="menu"
                        size="sm"
                        role="menuitem"
                        onClick={handleCopyMarkdown}
                        className="border-b border-neutral-900"
                    >
                        Copy as Markdown
                    </Button>
                    <Button
                        variant="menu"
                        size="sm"
                        role="menuitem"
                        onClick={handleCopyLlmsUrl}
                    >
                        Copy llms.txt URL
                    </Button>
                </div>
            ) : null}

            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                className={cn(
                    'flex items-center gap-2 px-3 py-2 bg-neutral-950/95 backdrop-blur border uppercase tracking-[0.2em] text-2xs transition-colors shadow-lg cursor-pointer',
                    open
                        ? 'border-yellow-400 text-yellow-400'
                        : 'border-neutral-800 text-neutral-300 hover:border-yellow-400 hover:text-yellow-400',
                )}
            >
                <span className="text-yellow-400">{'</>'}</span>
                <span>.md</span>
            </button>
        </div>
    );
}

export default MarkdownActions;
