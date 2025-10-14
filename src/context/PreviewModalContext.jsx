// src/context/PreviewModalContext.jsx
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";
import MoviePreviewModal from "../components/MoviePreviewModal";

// Public API from this context:
// - showPreview(movie, anchorEl, expand=false, opts?: { immediate?: boolean })
// - scheduleHide(delayMs=140)
// - cancelHide()

const PreviewModalContext = createContext(null);

export function PreviewModalProvider({ children }) {
    const [state, setState] = useState({
        isOpen: false,
        isExpanded: false,
        movie: null,
        anchorEl: null,
        anchorRect: null,
    });

    // Prevent auto-hide while expanded
    const [lockOpen, setLockOpen] = useState(false);

    const hideTimerRef = useRef(null);

    const clearTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const cancelHide = useCallback(() => {
        clearTimer();
    }, [clearTimer]);

    const scheduleHide = useCallback(
        (ms = 200) => {
            // Ignore hides while expanded/locked open
            if (lockOpen) return;
            clearTimer();
            hideTimerRef.current = setTimeout(() => {
                setState((s) => ({
                    ...s,
                    isOpen: false,
                    isExpanded: false,
                    movie: null,
                    anchorEl: null,
                    anchorRect: null,
                }));
                hideTimerRef.current = null;
            }, ms);
        },
        [lockOpen, clearTimer]
    );

    const computeRect = useCallback((el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, left: r.left, width: r.width, height: r.height };
    }, []);

    const showPreview = useCallback(
        (movie, anchorEl, expand = false, opts = {}) => {
            cancelHide(); // we’re about to show/swap; kill any pending hide
            const anchorRect = computeRect(anchorEl);
            setState((prev) => {
                const next = {
                    isOpen: true,
                    isExpanded: !!expand,
                    movie,
                    anchorEl,
                    anchorRect,
                };
                return next;
            });
        },
        [cancelHide, computeRect]
    );

    const value = useMemo(
        () => ({
            showPreview,
            scheduleHide,
            cancelHide,
            state,
        }),
        [showPreview, scheduleHide, cancelHide, state]
    );

    // Close helper used by the modal's onClose
    const hardClose = useCallback(() => {
        setLockOpen(false); // unlock
        cancelHide(); // ensure no trailing timer fires
        setState((s) => ({
            ...s,
            isOpen: false,
            isExpanded: false,
            movie: null,
            anchorEl: null,
            anchorRect: null,
        }));
    }, [cancelHide]);

    return (
        <PreviewModalContext.Provider value={value}>
            {children}

            {state.isOpen && state.movie && (
                <MoviePreviewModal
                    movie={state.movie}
                    startExpanded={state.isExpanded}
                    anchorRect={state.anchorRect}
                    getAnchorRect={() =>
                        state.anchorEl ? state.anchorEl.getBoundingClientRect() : null
                    }

                    // Keep hover mini-modal alive while pointer is over it
                    __onCompactPointerEnter={cancelHide}
                    __onCompactPointerLeave={() => scheduleHide(120)}

                    // >>> IMPLEMENTED: lock while expanded + cancel pending hides before expanding
                    __cancelHide={cancelHide}
                    __onExpand={() => setLockOpen(true)}

                    // When the modal requests close (backdrop/close button/Escape)
                    onClose={hardClose}
                />
            )}
        </PreviewModalContext.Provider>
    );
}

export function usePreviewModal() {
    const ctx = useContext(PreviewModalContext);
    if (!ctx) {
        throw new Error(
            "usePreviewModal must be used within <PreviewModalProvider>"
        );
    }
    return ctx;
}