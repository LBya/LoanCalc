import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * A small (?) info icon that shows a popover on hover/click with metric explanation and formula.
 * Uses fixed positioning with z-9999 to escape any overflow:hidden containers.
 */
export default function CalculationPopover({ explanation, formula, link, linkLabel }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState('top');
  const [arrowX, setArrowX] = useState('50%');
  const triggerRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const popWidth = 256; // w-64 = 256px
    const popoverHeight = 120; // approximate

    // Center popover on trigger, clamp to viewport
    let left = trigger.left + trigger.width / 2 - popWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popWidth - 8));

    // Arrow offset from popover left edge to trigger center
    const arrowOffset = trigger.left + trigger.width / 2 - left;

    // Determine vertical placement
    const roomAbove = trigger.top > popoverHeight + 12;
    setSide(roomAbove ? 'top' : 'bottom');
    setArrowX(`${arrowOffset}px`);
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleClick = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', () => setOpen(false), true);
    window.addEventListener('resize', updatePosition);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', () => setOpen(false), true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  // Compute popover style from trigger position
  const getPopoverStyle = () => {
    if (!triggerRef.current) return {};
    const trigger = triggerRef.current.getBoundingClientRect();
    const popWidth = 256;
    let left = trigger.left + trigger.width / 2 - popWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popWidth - 8));

    if (side === 'top') {
      return {
        position: 'fixed',
        bottom: `${window.innerHeight - trigger.top + 8}px`,
        left: `${left}px`,
        zIndex: 9999,
      };
    }
    return {
      position: 'fixed',
      top: `${trigger.bottom + 8}px`,
      left: `${left}px`,
      zIndex: 9999,
    };
  };

  return (
    <span className="inline-flex items-center ml-1" ref={triggerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="w-4 h-4 rounded-full border border-muted-foreground/40 text-muted-foreground text-[10px] leading-none flex items-center justify-center hover:border-primary hover:text-primary transition-colors cursor-pointer"
        aria-label="How is this calculated?"
      >
        ?
      </button>
      {open && (
        <div
          style={getPopoverStyle()}
          className="w-64 p-3 rounded-lg bg-popover border border-border shadow-lg text-xs text-popover-foreground"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Arrow pointing at trigger */}
          <div
            className="absolute w-2.5 h-2.5 rotate-45 bg-popover"
            style={{
              left: arrowX,
              marginLeft: '-5px',
              ...(side === 'top'
                ? { bottom: '-5px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }
                : { top: '-5px', borderLeft: '1px solid var(--border)', borderTop: '1px solid var(--border)' }),
            }}
          />
          <p className="font-medium text-popover-foreground mb-1">{explanation}</p>
          {formula && (
            <p className="text-muted-foreground font-mono text-[11px] mb-0 bg-muted px-2 py-1 rounded break-words">{formula}</p>
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
