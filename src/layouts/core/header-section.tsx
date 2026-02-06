import type { Breakpoint } from '@mui/material/styles';
import type { AppBarProps } from '@mui/material/AppBar';
import type { ToolbarProps } from '@mui/material/Toolbar';
import type { ContainerProps } from '@mui/material/Container';

import React, { useEffect } from 'react';
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
            flex: '1 1 auto',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            width: '100%',
            backgroundColor: 'red',
            color: '#fff',
            padding: '4px 0',
            fontWeight: 600,
            position: 'relative',
            height: '32px',
            borderRadius: '8px',
          }}
        >
          <Box
            sx={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              animation: 'marquee 15s linear infinite',
              '@keyframes marquee': {
                '0%': { transform: 'translateX(100%)' },
                '100%': { transform: 'translateX(-100%)' },
              },
            }}
          >
            {loading ? 'Loading announcements...' : marqueeText || ''}
          </Box>
        </Box>
      )}

      {!disableElevation && offsetTop && <StyledElevation />}
    </AppBar>
  );
}
