import React, { useState, useEffect } from 'react';

import {
  Box, Dialog, Button, TextField,
  IconButton, DialogTitle, DialogContent, DialogActions, InputAdornment
} from '@mui/material';

import { decrypt } from 'src/utils/encryption'

import useUpdatePassApi from 'src/Api/passwordUdpate/useUpdatePassApi';

import { Iconify } from 'src/components/iconify';

import { useMockedUser } from 'src/auth/hooks';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { user } = useMockedUser();
  const { updatepassword } = useUpdatePassApi();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

useEffect(() => {
  if (user?.password) {
    const decryptedPassword = decrypt(user.password, 10); 
    setOldPassword(decryptedPassword);
  }
}, [user]);


  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      setError("Both fields are required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updatepassword(user.id, {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      onClose();
    } catch (err) {
      setError(' Please check  password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <TextField
          label="Old Password"
          type="text"
          fullWidth
          margin="normal"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <TextField
          label="New Password"
          type={showNewPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  edge="end"
                >
                  <Iconify icon={showNewPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {error && <Box mt={1} color="error.main">{error}</Box>}
        {success && <Box mt={1} color="success.main">{success}</Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleChangePassword} color='primary' variant="contained" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
