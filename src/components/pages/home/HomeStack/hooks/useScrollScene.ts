import { useEffect, useRef, type DependencyList, type RefObject } from 'react';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

// GSAP + ScrollTrigger を client-only & lazy で 1 度だけ登録し、
// 各セクションが setup 関数内で timeline / ScrollTrigger を構築するためのフック。
//
// gsap.context(() => {...}, container) で scope を切り、cleanup は ctx.revert() で
// scope 内の trigger / animation を全部 kill する。
// dynamic import なので gsap 本体 (~50KB gzip) は HomeStack マウント時にだけロードされる。

type GSAP = typeof gsapType;
type ScrollTriggerStatic = typeof ScrollTriggerType;

let cachedGsap: GSAP | null = null;
let cachedScrollTrigger: ScrollTriggerStatic | null = null;
let registerPromise: Promise<void> | null = null;

const ensureRegistered = async (): Promise<void> => {
    if (cachedGsap && cachedScrollTrigger) return;
    if (!registerPromise) {
        registerPromise = (async () => {
            const [gsapMod, stMod] = await Promise.all([
                import('gsap'),
                import('gsap/ScrollTrigger'),
            ]);
            const gsap = gsapMod.default ?? (gsapMod as unknown as GSAP);
            const ScrollTrigger = stMod.ScrollTrigger;
            gsap.registerPlugin(ScrollTrigger);
            cachedGsap = gsap;
            cachedScrollTrigger = ScrollTrigger;
        })();
    }
    await registerPromise;
};

export interface ScrollSceneApi {
    gsap: GSAP;
    ScrollTrigger: ScrollTriggerStatic;
    container: HTMLElement;
}

export type ScrollSceneSetup = (api: ScrollSceneApi) => (() => void) | void;

export interface UseScrollSceneOptions {
    setup: ScrollSceneSetup;
    deps?: DependencyList;
    disabled?: boolean;
}

export function useScrollScene<T extends HTMLElement>(
    containerRef: RefObject<T | null>,
    options: UseScrollSceneOptions,
): void {
    const setupRef = useRef(options.setup);
    setupRef.current = options.setup;
    const disabledRef = useRef(options.disabled);
    disabledRef.current = options.disabled;

    // deps を spread して useEffect の依存に渡す
    const deps = options.deps ?? [];

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (disabledRef.current) return;
        const container = containerRef.current;
        if (!container) return;

        let cancelled = false;
        let userCleanup: (() => void) | void;
        let ctx: ReturnType<GSAP['context']> | null = null;

        ensureRegistered()
            .then(() => {
                if (cancelled) return;
                const gsap = cachedGsap;
                const ScrollTrigger = cachedScrollTrigger;
                if (!gsap || !ScrollTrigger) return;
                ctx = gsap.context(() => {
                    userCleanup = setupRef.current({
                        gsap,
                        ScrollTrigger,
                        container,
                    });
                }, container);
            })
            .catch((err) => {
                if (import.meta.env.DEV) {
                    console.error('[useScrollScene] failed to load gsap', err);
                }
            });

        return () => {
            cancelled = true;
            if (typeof userCleanup === 'function') {
                try {
                    userCleanup();
                } catch (e) {
                    if (import.meta.env.DEV) console.error(e);
                }
            }
            if (ctx) ctx.revert();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
