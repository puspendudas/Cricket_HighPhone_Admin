import type { Member, AdminPermissions } from 'src/Interface/admin.interface';

import React, { useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Dialog,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';

interface EditPowerUserPermissionsModalProps {
  open: boolean;
  onClose: () => void;
  powerUser: Member | null;
  onSave: (permissions: AdminPermissions) => Promise<void>;
}

export function EditPowerUserPermissionsModal({
  open,
  onClose,
  powerUser,
  onSave,
}: EditPowerUserPermissionsModalProps) {
  const [permissions, setPermissions] = useState<AdminPermissions>({
    rollback_match: false,
    cancel_match: false,
    rollback_session: false,
    cancel_session: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (powerUser) {
      setPermissions({
        rollback_match: Boolean(powerUser.permissions?.rollback_match),
        cancel_match: Boolean(powerUser.permissions?.cancel_match),
        rollback_session: Boolean(powerUser.permissions?.rollback_session),
        cancel_session: Boolean(powerUser.permissions?.cancel_session),
      });
    }
  }, [powerUser, open]);

  const handleToggle = (key: keyof AdminPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(permissions);
      onClose();
    } catch (err) {
      console.error('Failed to update permissions', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Manage Permissions
        {powerUser && (
          <Typography variant="body2" color="text.secondary">
            {powerUser.name} ({powerUser.user})
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Enable or restrict operational action permissions for this Power User.
          </Typography>

          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2">Rollback Match</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow rolling back declared Bookmaker matches
                  </Typography>
                </Box>
                <Switch
                  checked={permissions.rollback_match}
                  onChange={() => handleToggle('rollback_match')}
                  color="primary"
                />
              </Box>
            </Grid>
            <Divider />

            <Grid item>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2">Cancel Match</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow cancelling Bookmaker match markets
                  </Typography>
                </Box>
                <Switch
                  checked={permissions.cancel_match}
                  onChange={() => handleToggle('cancel_match')}
                  color="primary"
                />
              </Box>
            </Grid>
            <Divider />

            <Grid item>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2">Rollback Session</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow rolling back declared Fancy sessions
                  </Typography>
                </Box>
                <Switch
                  checked={permissions.rollback_session}
                  onChange={() => handleToggle('rollback_session')}
                  color="primary"
                />
              </Box>
            </Grid>
            <Divider />

            <Grid item>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2">Cancel Session</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Allow cancelling Fancy session markets
                  </Typography>
                </Box>
                <Switch
                  checked={permissions.cancel_session}
                  onChange={() => handleToggle('cancel_session')}
                  color="primary"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Permissions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
