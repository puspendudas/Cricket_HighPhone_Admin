import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
// import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
// import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
// import Tooltip from '@mui/material/Tooltip';
import { List, Button, Divider, ListItem, ListItemText } from '@mui/material';

// import { paths } from 'src/routes/paths';
// import { useRouter} from 'src/routes/hooks';

// import { _mock } from 'src/_mock';
import { varAlpha } from 'src/theme/styles';

// import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateAvatar } from 'src/components/animate';

import { useMockedUser } from 'src/auth/hooks';

import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';
import ChangePasswordModal from './ChangePasswordModal';

// ----------------------------------------------------------------------

export type AccountDrawerProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountDrawer({ data = [], sx, ...other }: AccountDrawerProps) {
  const [openChangePassword, setOpenChangePassword] = useState(false);

  const theme = useTheme();

  // const router = useRouter();

  // const pathname = usePathname();

  const { user } = useMockedUser();

  const [open, setOpen] = useState(false);

  const handleOpenDrawer = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setOpen(false);
  }, []);

  // const handleClickItem = useCallback(
  //   (path: string) => {
  //     handleCloseDrawer();
  //     router.push(path);
  //   },
  //   [handleCloseDrawer, router]
  // );

  const renderAvatar = (
    <AnimateAvatar
      width={96}
      slotProps={{
        avatar: { src: user?.photoURL, alt: user?.name },
        overlay: {
          border: 2,
          spacing: 3,
          color: `linear-gradient(135deg, ${varAlpha(theme.vars.palette.primary.mainChannel, 0)} 25%, ${theme.vars.palette.primary.main} 100%)`,
        },
      }}
    >
      {user?.name?.charAt(0).toUpperCase()}
    </AnimateAvatar>
  );

  return (
    <>
      <AccountButton
        open={open}
        onClick={handleOpenDrawer}
        photoURL={user?.photoURL}
        name={user?.name}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={handleCloseDrawer}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 320 } }}
      >
        <IconButton
          onClick={handleCloseDrawer}
          sx={{ top: 12, left: 12, zIndex: 9, position: 'absolute' }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Stack alignItems="center" sx={{ pt: 8 }}>
            {renderAvatar}

            <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
              {user?.name}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
              {user?.email}
            </Typography>
          </Stack>

          <List>
            <ListItem>
              <Iconify icon="mdi:account-multiple" width={24} sx={{ mr: 2, color: 'gray' }} />
              <ListItemText primary="Share" />
              <Typography variant="subtitle1">{user.share}</Typography>
            </ListItem>
            <ListItem>
              <Iconify icon="mdi:soccer" width={24} sx={{ mr: 2, color: 'gray' }} />
              <ListItemText primary="Match Commission" />
              <Typography variant="subtitle1">{user.match_commission}</Typography>
            </ListItem>
            <ListItem>
              <Iconify icon="mdi:account-cash" width={24} sx={{ mr: 2, color: 'gray' }} />
              <ListItemText primary="Session Commission" />
              <Typography variant="subtitle1">{user.session_commission}</Typography>
            </ListItem>
            <ListItem>
              <Iconify icon="mdi:cards-playing-club" width={24} sx={{ mr: 2, color: 'gray' }} />
              <ListItemText primary="Casino Commission" />
              <Typography variant="subtitle1">{user.casino_commission}</Typography>
            </ListItem>

            <Divider sx={{ my: 1 }} />

            <ListItem>
              <Iconify icon="mdi:wallet-outline" width={24} sx={{ mr: 2, color: 'gray' }} />
              <ListItemText primary="Wallet" />
              <Typography variant="subtitle1">
                ₹ {user.wallet.toLocaleString('en-IN')}
              </Typography>
            </ListItem>
          </List>

          {/* <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ p: 3 }}>
            {[...Array(3)].map((_, index) => (
              <Tooltip
                key={_mock.fullName(index + 1)}
                title={`Switch to: ${_mock.fullName(index + 1)}`}
              >
                <Avatar
                  alt={_mock.fullName(index + 1)}
                  src={_mock.image.avatar(index + 1)}
                  onClick={() => {}}
                />
              </Tooltip>
            ))}

            <Tooltip title="Add account">
              <IconButton
                sx={{
                  bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                  border: `dashed 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.32)}`,
                }}
              >
                <Iconify icon="mingcute:add-line" />
              </IconButton>
            </Tooltip>
          </Stack> */}

          {/* <Stack
            sx={{
              py: 3,
              px: 2.5,
              borderTop: `dashed 1px ${theme.vars.palette.divider}`,
              borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
            }}
          >
            {data.map((option) => {
              const rootLabel = pathname.includes('/dashboard') ? 'Home' : 'Dashboard';

              const rootHref = pathname.includes('/dashboard') ? '/' : paths.dashboard.root;

              return (
                <MenuItem
                  key={option.label}
                  onClick={() => handleClickItem(option.label === 'Home' ? rootHref : option.href)}
                  sx={{
                    py: 1,
                    color: 'text.secondary',
                    '& svg': { width: 24, height: 24 },
                    '&:hover': { color: 'text.primary' },
                  }}
                >
                  {option.icon}

                  <Box component="span" sx={{ ml: 2 }}>
                    {option.label === 'Home' ? rootLabel : option.label}
                  </Box>

                  {option.info && (
                    <Label color="error" sx={{ ml: 1 }}>
                      {option.info}
                    </Label>
                  )}
                </MenuItem>
              );
            })}
          </Stack>        */}
        </Scrollbar>

        <Box sx={{ p: 2.5 }}>
          <Button
            fullWidth
            variant="soft"
            size="large"
            color="primary"
            sx={{ mb: 2 }}
            onClick={() => setOpenChangePassword(true)}
          >
            Change Password
          </Button>

          <SignOutButton onClose={handleCloseDrawer} />
        </Box>
        <ChangePasswordModal
          open={openChangePassword}
          onClose={() => setOpenChangePassword(false)}
        />
      </Drawer>
    </>
  );
}
