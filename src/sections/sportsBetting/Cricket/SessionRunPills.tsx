import React, { useRef, useState, useEffect, useCallback } from 'react';

import { Box, Tooltip, IconButton, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

export interface SessionRunItem {
  run: number;
  pl: number;
}

export interface SessionRunRange {
  minRun: number | null;
  maxRun: number | null;
  pl: number;
  label: string;
}

export interface SessionExposureData {
  selectionId?: number | string;
  runnerName?: string;
  runs?: SessionRunItem[];
  runRanges?: SessionRunRange[];
  maxLoss?: number;
  maxProfit?: number;
  totalBets?: number;
}

export function findSessionExposure(
  runnerName: string,
  bets: any[] = [],
  sessionWisePotentialPL?: Record<string, SessionExposureData>
): SessionExposureData | undefined {
  if (!sessionWisePotentialPL) return undefined;

  // 1. Lookup by selection_id if present on any bet
  const firstBet = bets?.[0];
  const sid = firstBet?.selection_id;
  if (sid != null) {
    if (sessionWisePotentialPL[sid]) return sessionWisePotentialPL[sid];
    if (sessionWisePotentialPL[String(sid)]) return sessionWisePotentialPL[String(sid)];
  }

  // 2. Lookup by exact runnerName
  if (sessionWisePotentialPL[runnerName]) {
    return sessionWisePotentialPL[runnerName];
  }

  // 3. Lookup by normalized runnerName (stripped of whitespace & lowercase)
  const normalized = runnerName.toLowerCase().replace(/\s+/g, '');
  if (sessionWisePotentialPL[normalized]) {
    return sessionWisePotentialPL[normalized];
  }

  // 4. Lookup by case-insensitive key scan
  const matchedKey = Object.keys(sessionWisePotentialPL).find(
    (k) => k.toLowerCase().replace(/\s+/g, '') === normalized
  );
  if (matchedKey) {
    return sessionWisePotentialPL[matchedKey];
  }

  return undefined;
}

interface SessionRunPillsProps {
  sessionData?: SessionExposureData | null;
}

export const SessionRunPills: React.FC<SessionRunPillsProps> = ({ sessionData }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  // Update scroll buttons on mount, resize, scroll, and runs update
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return undefined;
    }

    checkScrollability();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkScrollability();
      });
      ro.observe(el);
    }

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    // Run checks across animation frames to catch Collapse expand animations
    const t1 = setTimeout(checkScrollability, 100);
    const t2 = setTimeout(checkScrollability, 350);

    return () => {
      if (ro) ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, sessionData?.runs]);

  // Translate mouse wheel into horizontal scroll on desktop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return undefined;
    }

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        const canScrollMore =
          (e.deltaY > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 2) ||
          (e.deltaY < 0 && el.scrollLeft > 2);

        if (canScrollMore) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.5;
          checkScrollability();
        }
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [checkScrollability]);

  // Mouse drag to scroll handlers for desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const walk = (x - startXRef.current) * 1.5;
      scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
      checkScrollability();
    };

    const handleWindowMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [checkScrollability]);

  const scrollByStep = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -260 : 260;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
  };

  if (!sessionData?.runs || sessionData.runs.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.neutral',
        borderTop: '1px solid',
        borderColor: 'divider',
        px: 0.5,
        overflow: 'hidden',
      }}
    >
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <IconButton
          size="small"
          onClick={() => scrollByStep('left')}
          sx={{
            flexShrink: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            p: 0.5,
            mr: 0.5,
            '&:hover': { bgcolor: 'background.paper' },
          }}
          title="Scroll Left"
        >
          <Iconify icon="eva:chevron-left-fill" width={18} height={18} />
        </IconButton>
      )}

      {/* Horizontal Scrollable Pills Track */}
      <Box
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        sx={{
          flex: 1,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          p: 1.25,
          alignItems: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(140, 140, 140, 0.4) transparent',
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'rgba(0,0,0,0.05)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 4,
            bgcolor: 'rgba(140, 140, 140, 0.4)',
            '&:hover': {
              bgcolor: 'rgba(140, 140, 140, 0.7)',
            },
          },
        }}
      >
        {sessionData.runs.map(({ run, pl }) => {
          const isProfit = pl >= 0;
          const formattedPL =
            Math.abs(pl % 1) > 0.001
              ? pl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : Math.round(pl).toLocaleString('en-IN');

          return (
            <Tooltip
              key={run}
              title={`Run ${run}: ${pl >= 0 ? '+' : ''}${formattedPL} P/L`}
              arrow
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  px: 1,
                  py: '3px',
                  borderRadius: '20px',
                  bgcolor: isProfit ? '#00A76F' : '#FF5630',
                  color: '#FFFFFF',
                  flexShrink: 0,
                  userSelect: 'none',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formattedPL}
                </Typography>
                <Box
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#1a1a1a',
                    borderRadius: '10px',
                    px: '6px',
                    py: '1px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {run}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <IconButton
          size="small"
          onClick={() => scrollByStep('right')}
          sx={{
            flexShrink: 0,
            zIndex: 2,
            bgcolor: 'background.paper',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            p: 0.5,
            ml: 0.5,
            '&:hover': { bgcolor: 'background.paper' },
          }}
          title="Scroll Right"
        >
          <Iconify icon="eva:chevron-right-fill" width={18} height={18} />
        </IconButton>
      )}
    </Box>
  );
};

export default SessionRunPills;
