import { forwardRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { CONFIG } from 'src/config-global';

import { imageClasses } from './classes';

import type { ImageProps } from './types';

// ----------------------------------------------------------------------

const ImageWrapper = styled(Box)({
  overflow: 'hidden',
  position: 'relative',
  verticalAlign: 'bottom',
  display: 'inline-block',
  [`& .${imageClasses.wrapper}`]: {
    width: '100%',
    height: '100%',
    verticalAlign: 'bottom',
    backgroundSize: 'cover !important',
  },
});

const Overlay = styled('span')({
  top: 0,
  left: 0,
  zIndex: 1,
  width: '100%',
  height: '100%',
  position: 'absolute',
});

// ----------------------------------------------------------------------

export const Image = forwardRef<HTMLSpanElement, ImageProps>(
  (
    {
      ratio,
      disabledEffect = false,
      //
      alt,
      src,
      delayTime,
      threshold,
      beforeLoad,
      delayMethod,
      placeholder,
      wrapperProps,
      scrollPosition,
      effect = 'blur',
      visibleByDefault,
      wrapperClassName,
      useIntersectionObserver,
      //
      slotProps,
      sx,
      ...other
    },
    ref
  ) => {
    const content = (
      (LazyLoadImage as any)({
        alt,
        src,
        delayTime,
        threshold,
        beforeLoad,
        delayMethod,
        placeholder,
        wrapperProps,
        scrollPosition,
        visibleByDefault,
        effect: visibleByDefault || disabledEffect ? undefined : effect,
        useIntersectionObserver,
        wrapperClassName: wrapperClassName || imageClasses.wrapper,
        placeholderSrc:
          visibleByDefault || disabledEffect
            ? `${CONFIG.site.basePath}/assets/transparent.png`
            : `${CONFIG.site.basePath}/assets/placeholder.svg`,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          verticalAlign: 'bottom',
          aspectRatio: ratio ? String(ratio) : undefined,
        },
      })
    );

    return (
      <ImageWrapper
        ref={ref}
        component="span"
        className={imageClasses.root}
        sx={{ ...(!!ratio && { width: 1 }), ...sx }}
        {...other}
      >
        {slotProps?.overlay && <Overlay className={imageClasses.overlay} sx={slotProps?.overlay} />}

        {content}
      </ImageWrapper>
    );
  }
);
