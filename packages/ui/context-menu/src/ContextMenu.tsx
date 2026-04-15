import { cloneElement, isValidElement, ComponentChildren } from 'preact';
import { createPortal, forwardRef } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';

// ---------------------------------------------------------------------------
// Inline icon
// ---------------------------------------------------------------------------

interface IconProps {
  className?: string;
  width?: number;
  height?: number;
}

const ChevronRight = ({ className, width = 24, height = 24 }: IconProps) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width={width}
    height={height}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    stroke-width='2'
    stroke-linecap='round'
    stroke-linejoin='round'
    className={className}
  >
    <path d='m9 18 6-6-6-6' />
  </svg>
);

// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: ComponentChildren;
  className?: string;
}

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  ({ x, y, onClose, children, className }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);

    const setRefs = (node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        ref.current = node;
      }
    };

    useEffect(() => {
      const handleCloseAll = () => onClose();
      const handleClickOutside = (event: MouseEvent) => {
        if (
          internalRef.current &&
          !internalRef.current.contains(event.target as Node)
        ) {
          const target = event.target as HTMLElement;
          if (target.closest('[data-submenu-content]')) return;
          onClose();
        }
      };

      window.dispatchEvent(new CustomEvent('dayflow-close-all-menus'));
      window.addEventListener('dayflow-close-all-menus', handleCloseAll);
      document.body.addEventListener('mousedown', handleClickOutside, {
        capture: true,
      });
      document.body.addEventListener('contextmenu', handleClickOutside, {
        capture: true,
      });

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      const handleScrollOrResize = () => onClose();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);

      return () => {
        window.removeEventListener('dayflow-close-all-menus', handleCloseAll);
        document.body.removeEventListener('mousedown', handleClickOutside, {
          capture: true,
        });
        document.body.removeEventListener('contextmenu', handleClickOutside, {
          capture: true,
        });
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }, [onClose]);

    const style: Record<string, number | string> = { top: y, left: x };

    return createPortal(
      <div
        ref={setRefs}
        className={`df-portal df-animate-in df-fade-in df-zoom-in-95 fixed z-50 min-w-32 overflow-visible rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md duration-100 ease-out dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${className || ''}`}
        style={style}
        onContextMenu={e => e.preventDefault()}
        data-context-menu-root='true'
      >
        {children}
      </div>,
      document.body
    );
  }
);

ContextMenu.displayName = 'ContextMenu';

// ---------------------------------------------------------------------------
// ContextMenuItem
// ---------------------------------------------------------------------------

export const ContextMenuItem = ({
  onClick,
  children,
  icon,
  danger,
  disabled,
}: {
  onClick: () => void;
  children: ComponentChildren;
  icon?: ComponentChildren;
  danger?: boolean;
  disabled?: boolean;
}) => (
  <div
    className={`group relative flex cursor-default items-center rounded-sm px-3 py-0.5 text-[12px] transition-colors outline-none select-none ${
      disabled
        ? 'pointer-events-none opacity-50'
        : 'hover:bg-[var(--df-color-primary)] hover:text-[var(--df-color-primary-foreground)] focus:bg-[var(--df-color-primary)] focus:text-[var(--df-color-primary-foreground)]'
    } ${
      danger
        ? 'df-text-destructive df-hover-fill-destructive df-focus-fill-destructive'
        : 'text-[var(--df-color-foreground)]'
    }`}
    onClick={e => {
      e.stopPropagation();
      if (!disabled) onClick();
    }}
    data-disabled={disabled}
  >
    {icon && <span className='mr-2 h-4 w-4'>{icon}</span>}
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// ContextMenuSeparator
// ---------------------------------------------------------------------------

export const ContextMenuSeparator = () => (
  <div className='-mx-1 my-1 h-px bg-slate-200 dark:bg-slate-800' />
);

// ---------------------------------------------------------------------------
// ContextMenuLabel
// ---------------------------------------------------------------------------

export const ContextMenuLabel = ({
  children,
}: {
  children: ComponentChildren;
}) => (
  <div className='px-3 py-0.5 text-[12px] font-semibold text-slate-950 dark:text-slate-50'>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// ContextMenuSub
// ---------------------------------------------------------------------------

export const ContextMenuSub = ({
  children,
}: {
  children: ComponentChildren;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 100);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return (
    <div
      className='relative'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {(Array.isArray(children) ? children : [children]).map(child => {
        if (isValidElement(child)) return cloneElement(child, { isOpen });
        return child;
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ContextMenuSubTrigger
// ---------------------------------------------------------------------------

export const ContextMenuSubTrigger = ({
  children,
  icon,
  isOpen,
}: {
  children: ComponentChildren;
  icon?: ComponentChildren;
  isOpen?: boolean;
}) => (
  <div
    className={`relative flex cursor-default items-center rounded-sm px-3 py-0.5 text-[12px] text-[var(--df-color-foreground)] transition-colors outline-none select-none hover:bg-[var(--df-color-primary)] hover:text-[var(--df-color-primary-foreground)] focus:bg-[var(--df-color-primary)] focus:text-[var(--df-color-primary-foreground)] ${isOpen ? 'bg-[var(--df-color-primary)] text-[var(--df-color-primary-foreground)]' : ''}`}
  >
    {icon && <span className='mr-2 h-4 w-4'>{icon}</span>}
    <span className='grow text-left'>{children}</span>
    <ChevronRight
      className={`ml-auto h-4 w-4 ${isOpen ? 'text-white opacity-100' : 'opacity-60'}`}
    />
  </div>
);

// ---------------------------------------------------------------------------
// ContextMenuSubContent
// ---------------------------------------------------------------------------

export const ContextMenuSubContent = ({
  children,
  isOpen,
}: {
  children: ComponentChildren;
  isOpen?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'right' | 'left'>('right');

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const parentRect = ref.current.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setPosition(
          parentRect.right + rect.width > window.innerWidth ? 'left' : 'right'
        );
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className='df-portal df-animate-in df-fade-in df-zoom-in-95 absolute top-0 z-50 min-w-32 overflow-hidden rounded-md border border-slate-200 bg-white p-1 whitespace-nowrap text-slate-950 shadow-md duration-100 ease-out dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50'
      style={{
        left: position === 'right' ? '100%' : 'auto',
        right: position === 'left' ? '100%' : 'auto',
        marginLeft: position === 'right' ? '0.25rem' : 0,
        marginRight: position === 'left' ? '0.25rem' : 0,
      }}
      data-submenu-content='true'
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ContextMenuColorPicker
// ---------------------------------------------------------------------------

const COLORS = [
  '#ea426b',
  '#f19a38',
  '#f7cf46',
  '#83d754',
  '#51aaf2',
  '#b672d0',
  '#957e5e',
];

export const ContextMenuColorPicker = ({
  selectedColor,
  onSelect,
  onCustomColor,
  customColorLabel = 'Custom Color',
}: {
  selectedColor?: string;
  onSelect: (color: string) => void;
  onCustomColor?: () => void;
  customColorLabel?: string;
}) => (
  <div>
    <div className='grid grid-cols-7 gap-2 p-1 px-3'>
      {COLORS.map(color => (
        <button
          key={color}
          type='button'
          className={`df-focus-ring-only h-5 w-5 rounded-full border border-gray-200 transition-transform hover:scale-110 focus:ring-2 focus:ring-offset-1 focus:outline-none dark:border-gray-600 dark:focus:ring-offset-slate-800 ${
            selectedColor?.toLowerCase() === color.toLowerCase()
              ? 'df-ring-primary-solid ring-2 ring-offset-1 dark:ring-offset-slate-800'
              : ''
          }`}
          style={{ backgroundColor: color }}
          onClick={e => {
            e.stopPropagation();
            onSelect(color);
          }}
          title={color}
        />
      ))}
    </div>
    {onCustomColor && (
      <div
        className='mt-1 flex cursor-pointer items-center rounded-sm px-3 py-0.5 text-[12px] text-[var(--df-color-foreground)] transition-colors hover:bg-[var(--df-color-primary)] hover:text-[var(--df-color-primary-foreground)]'
        onClick={e => {
          e.stopPropagation();
          onCustomColor();
        }}
      >
        {customColorLabel}
      </div>
    )}
  </div>
);
