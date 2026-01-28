import type { Updatepaylod } from 'src/Interface/agent.interface';

import { useState, useEffect } from 'react';

import {
  Box, Grid, Dialog, Button,
  TextField, Typography, DialogTitle, Autocomplete,
  DialogContent, DialogActions, InputAdornment
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

interface EditMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Updatepaylod) => Promise<void>;
  memberData: {
    id: string;
    code: string;
    name: string;
    password: string;
    status: 'Active' | 'Inactive';
    matchCommission: number;
    sessionCommission: number;
    casinoCommission: number;
    share: number;
  } | null;
}

export function EditAdminModal({
  open,
  onClose,
  memberData,
  onSubmit
}: EditMemberModalProps) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    password: '',
    status: 'Active' as 'Active' | 'Inactive',
    matchCommission: 0,
    sessionCommission: 0,
    casinoCommission: 0,
    share: 0,
  });

  useEffect(() => {
    if (memberData) {
      setForm({
        code: memberData.code,
        name: memberData.name,
        password: memberData.password,
        status: memberData.status,
        matchCommission: memberData.matchCommission,
        sessionCommission: memberData.sessionCommission,
        casinoCommission: memberData.casinoCommission,
        share: memberData.share,
      });
    }
  }, [memberData]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value) && value.length <= 2) {
      setForm((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    }
  };

  const handlePasswordGenerate = () => {
    const newPass = Math.floor(100000 + Math.random() * 900000).toString();
    setForm((prev) => ({ ...prev, password: newPass }));
  };

  const handleSubmit = async () => {
    if (!memberData) return;

    const payload: Updatepaylod = {
      name: form.name,
      password: form.password,
      match_commission: form.matchCommission,
      session_commission: form.sessionCommission,
      casino_commission: form.casinoCommission,
      status: form.status === 'Active',
      agent_id: undefined,
      share: form.share,
    };

    await onSubmit(payload);
    onClose();
  };

  if (!memberData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Member</DialogTitle>
      <DialogContent>
        {/* User Info */}
        <Box mb={3}>
          <Typography variant="subtitle1">User Basic Details</Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField
                label="Code"
                fullWidth
                value={form.code}
                name="code"
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Name"
                fullWidth
                value={form.name}
                name="name"
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Password Update */}
        <Grid item xs={3} mb={3} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handlePasswordGenerate}
            variant="outlined"
            startIcon={<Iconify icon="material-symbols:refresh" />}
          >
            Update Password
          </Button>
        </Grid>

        {/* Password & Status */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Share"
                fullWidth
                value={form.share}
                name="share"
                disabled
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Password"
                fullWidth
                value={form.password}
                name="password"
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={['Active', 'Inactive']}
                value={form.status}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setForm((prev) => ({
                      ...prev,
                      status: newValue as 'Active' | 'Inactive'
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Status" fullWidth />
                )}
                disableClearable
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>

        {/* Commissions */}
        <Box mb={3}>
          <Typography variant="subtitle1">Game Commission</Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={4}>
              <TextField
                label="Match Commission"
                fullWidth
                value={form.matchCommission}
                name="matchCommission"
                onChange={handleNumberChange}
                disabled
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Session Commission"
                fullWidth
                value={form.sessionCommission}
                name="sessionCommission"
                onChange={handleNumberChange}
                disabled
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Casino Commission"
                fullWidth
                value={form.casinoCommission}
                name="casinoCommission"
                onChange={handleNumberChange}
                disabled
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
