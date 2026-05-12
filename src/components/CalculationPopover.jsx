import { useState, useRef, useEffect } from 'react';

/**
 * A small (?) info icon that shows a popover on hover/click with metric explanation and formula.
 */
export default function CalculationPopover({ explanation, formula, link, linkLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <span className="relative inline-flex items-center ml-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full border border-muted-foreground/40 text-muted-foreground text-[10px] leading-none flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
        aria-label="How is this calculated?"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-popover border border-border shadow-lg text-xs text-popover-foreground">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
          </div>
          <p className="font-medium text-popover-foreground mb-1">{explanation}</p>
          {formula && (
            <p className="text-muted-foreground font-mono text-[11px] mb-1 bg-muted px-2 py-1 rounded">{formula}</p>
          )}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block mt-1"
            >
              {linkLabel || 'Learn more'} ↗
            </a>
          )}
        </div>
      )}
    </span>
  );
}
