import type { BoxProps } from '@mui/material/Box';

import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import NoSsr from '@mui/material/NoSsr';
// import { useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------
const logo = '/logo/logo-full.png';
export type LogoProps = BoxProps & {
  href?: string;
  disableLink?: boolean;
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ width = 100, height = 90, disableLink = false, className, href = '/', sx, ...other }, ref) => {
    // const theme = useTheme();



    // const PRIMARY_MAIN = theme.vars.palette.primary.main;


    /*
     * OR using local (public folder)
     * const logo = ( <Box alt="logo" component="img" src={`${CONFIG.site.basePath}/logo/logo-single.svg`} width={width} height={height} /> );
     */

    const logo1 = <img src={logo} alt="logo" style={{borderRadius: '50%'}} />;

    return (
      <NoSsr
        fallback={
          <Box
            width={width}
            height={height}
            className={logoClasses.root.concat(className ? ` ${className}` : '')}
            sx={{ flexShrink: 0, display: 'inline-flex', verticalAlign: 'middle', ...sx }}
          />
        }
      >
        <Box
          ref={ref}
          component={RouterLink}
          href={href}
          width={width}
          height={height}
          className={logoClasses.root.concat(className ? ` ${className}` : '')}
          aria-label="logo"
          sx={{
            borderRadius: '50%',
            flexShrink: 0,
            display: 'inline-flex',
            verticalAlign: 'middle',
            ...(disableLink && { pointerEvents: 'none' }),
            ...sx,
          }}
          {...other}
        >
          {logo1} 
        </Box>
        
      </NoSsr>
    );
  }
);
