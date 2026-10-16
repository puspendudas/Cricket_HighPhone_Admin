import type { Breakpoint } from '@mui/material/styles';
import type { AppBarProps } from '@mui/material/AppBar';
import type { ToolbarProps } from '@mui/material/Toolbar';
import type { ContainerProps } from '@mui/material/Container';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import { styled, useTheme } from '@mui/material/styles';

import { useScrollOffSetTop } from 'src/hooks/use-scroll-offset-top';

import { bgBlur, varAlpha } from 'src/theme/styles';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchAnnouncements } from 'src/store/slices/announcementSlice';
import { Iconify } from 'src/components/iconify';

import { layoutClasses } from '../classes';

// Styled shadow under header
const StyledElevation = styled('span')(({ theme }) => ({
  left: 0,
  right: 0,
  bottom: 0,
  m: 'auto',
  height: 24,
  zIndex: -1,
  opacity: 0.48,
  borderRadius: '50%',
  position: 'absolute',
  width: `calc(100% - 48px)`,
  boxShadow: theme.customShadows.z8,
}));

export type HeaderSectionProps = AppBarProps & {
  layoutQuery: Breakpoint;
  disableOffset?: boolean;
  disableElevation?: boolean;
  slots?: {
    leftArea?: React.ReactNode;
    rightArea?: React.ReactNode;
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
    centerArea?: React.ReactNode;

  };
  slotProps?: {
    toolbar?: ToolbarProps;
    container?: ContainerProps;
  };
};

export function HeaderSection({
  sx,
  slots,
  slotProps,
  disableOffset,
  disableElevation,
  layoutQuery = 'md',
  ...other
}: HeaderSectionProps) {
  const theme = useTheme();
  const { offsetTop } = useScrollOffSetTop();
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { marqueeText, loading, hasActiveStatus } = useAppSelector((state) => state.announcements);

  const gameIdMatch = location.pathname.match(/\/cricket-live-match-data\/(\d+)/);
  const gameId = gameIdMatch ? gameIdMatch[1] : undefined;

  const marqueeContentRef = useRef<HTMLDivElement>(null);
  const [marqueeDuration, setMarqueeDuration] = useState(25);

  const repeatedMarqueeText = useMemo(() => {
    if (!marqueeText) return '';
    const repeatCount = Math.max(2, Math.ceil(160 / Math.max(1, marqueeText.length)));
    return `${Array(repeatCount).fill(marqueeText).join('   •   ')}   •   `;
  }, [marqueeText]);

  useEffect(() => {
    const updateDuration = () => {
      if (marqueeContentRef.current) {
        const width = marqueeContentRef.current.offsetWidth;
        if (width > 0) {
          // 45 px/sec ensures a steady, comfortable reading speed on both mobile and desktop
          const calculatedDuration = Math.max(15, Math.round(width / 45));
          setMarqueeDuration(calculatedDuration);
        }
      }
    };

    updateDuration();
    const timer = setTimeout(updateDuration, 250);
    window.addEventListener('resize', updateDuration);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDuration);
    };
  }, [repeatedMarqueeText]);

  useEffect(() => {
    dispatch(fetchAnnouncements(gameId));
  }, [dispatch, gameId]);

  const toolbarStyles = {
    default: {
      minHeight: 'auto',
      height: 'var(--layout-header-mobile-height)',
      transition: theme.transitions.create(['height', 'background-color'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.shorter,
      }),
      [theme.breakpoints.up('sm')]: { minHeight: 'auto' },
      [theme.breakpoints.up(layoutQuery)]: { height: 'var(--layout-header-desktop-height)' },
    },
    offset: {
      ...bgBlur({ color: varAlpha(theme.vars.palette.background.defaultChannel, 0.8) }),
    },
  };

  return (
    <AppBar
      position="sticky"
      className={layoutClasses.header}
      sx={{
        zIndex: 'var(--layout-header-zIndex)',
        ...sx,
      }}
      {...other}
    >
      {slots?.topArea}

      <Toolbar
        disableGutters
        {...slotProps?.toolbar}
        sx={{
          ...toolbarStyles.default,
          ...(!disableOffset && offsetTop && toolbarStyles.offset),
          ...slotProps?.toolbar?.sx,
        }}
      >
        <Container
          {...slotProps?.container}
          sx={{
            height: 1,
            display: 'flex',
            alignItems: 'center',
            ...slotProps?.container?.sx,
          }}
        >
          {slots?.leftArea}

          <Box sx={{ display: 'flex', flex: '1 1 auto', justifyContent: 'center' }}>
            {slots?.centerArea}
          </Box>

          {slots?.rightArea}
        </Container>
      </Toolbar>

      {slots?.bottomArea}

      {/* ✅ Show marquee only if hasActiveStatus */}
      {hasActiveStatus && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            width: '100%',
            backgroundColor: '#dc2626',
            color: '#fff',
            fontWeight: 600,
            fontSize: { xs: '12px', sm: '13px' },
            position: 'relative',
            height: '32px',
            borderRadius: '8px',
            userSelect: 'none',
            '&:hover .admin-marquee-track': {
              animationPlayState: 'paused',
            },
          }}
        >
          {/* Pinned announcement icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1,
              zIndex: 2,
              backgroundColor: '#dc2626',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:volume-loud-bold-duotone" width={18} />
          </Box>

          {/* Marquee Track Container */}
          <Box
            sx={{
              overflow: 'hidden',
              display: 'flex',
              width: '100%',
              position: 'relative',
            }}
          >
            <Box
              className="admin-marquee-track"
              sx={{
                display: 'inline-flex',
                whiteSpace: 'nowrap',
                width: 'max-content',
                willChange: 'transform',
                animation: `adminMarqueeSeamless ${marqueeDuration}s linear infinite`,
                '@keyframes adminMarqueeSeamless': {
                  '0%': { transform: 'translateX(0%)' },
                  '100%': { transform: 'translateX(-50%)' },
                },
              }}
            >
              {/* Segment 1 */}
              <Box
                ref={marqueeContentRef}
                component="span"
                sx={{
                  display: 'inline-block',
                  pr: 2,
                }}
              >
                {loading ? 'Loading announcements...' : repeatedMarqueeText}
              </Box>
              {/* Segment 2 (seamless clone) */}
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  display: 'inline-block',
                  pr: 2,
                }}
              >
                {loading ? 'Loading announcements...' : repeatedMarqueeText}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {!disableElevation && offsetTop && <StyledElevation />}
    </AppBar>
  );
}
