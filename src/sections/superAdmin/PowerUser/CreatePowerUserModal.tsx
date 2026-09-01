import type { Member, MemberFormData } from 'src/Interface/admin.interface';

import React, { useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Dialog,
  Button,
  TextField,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
} from '@mui/material';

import useAdminApi from 'src/Api/admin_api/useAdminApi';

import { Iconify } from 'src/components/iconify';

interface CreatePowerUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
}

export function CreatePowerUserModal({ open, onClose, onSubmit }: CreatePowerUserModalProps) {
  const { fetchAdmin, GetPowerUserid } = useAdminApi();

  const [adminOptions, setAdminOptions] = useState<Member[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Member | null>(null);

  const [formData, setFormData] = useState<MemberFormData>({
    code: '',
    name: '',
    password: '',
    status: 'Active',
    share: 0,
    matchCommission: 0,
    sessionCommission: 0,
    casinoCommission: 0,
    mobile: '9999999999',
    type: 'power_user',
    wallet: 0,
    exposure: 0,
  });

  const resetForm = () => {
    setSelectedAdmin(null);
    setFormData({
      code: '',
      name: '',
      password: '',
      status: 'Active',
      share: 0,
      matchCommission: 0,
      sessionCommission: 0,
      casinoCommission: 0,
      mobile: '9999999999',
      type: 'power_user',
      wallet: 0,
      exposure: 0,
    });
  };

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await fetchAdmin();
        const formatted = response?.admin.map((admin: any, index: number) => ({
          id: index + 1,
          user: admin.user_name || '',
          name: admin.name || '',
          _id: admin._id,
          currentBal: `₹${admin.wallet || 0}`,
          share: admin.share || 0,
        }));
        setAdminOptions(formatted);
        if (formatted.length > 0) {
          setSelectedAdmin(formatted[0]);
          setFormData((prev) => ({
            ...prev,
            parent_id: formatted[0]._id,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch admins', err);
      }
    };

    const loadPowerUserId = async () => {
      try {
        const res = await GetPowerUserid();
        if (res?.user_name) {
          setFormData((prev) => ({
            ...prev,
            code: res.user_name,
          }));
        }
      } catch (err) {
        console.error('Failed to get power user id', err);
      }
    };

    if (open) {
      loadAdmins();
      loadPowerUserId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGeneratePassword = () => {
    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData((prev) => ({
      ...prev,
      password: newPassword,
    }));
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      user_name: formData.code,
      type: 'power_user',
      share: 0,
      wallet: 0,
      matchCommission: 0,
      sessionCommission: 0,
      casinoCommission: 0,
      status: formData.status === 'Active',
    };
    onSubmit(payload);
    resetForm();
    onClose();
  };

  const handleAdminChange = (event: any, newValue: Member | null) => {
    setSelectedAdmin(newValue);
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        parent_id: newValue._id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        parent_id: undefined,
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Power User</DialogTitle>
      <DialogContent>
        {/* Basic Details */}
        <Box mb={3}>
          <Typography variant="subtitle1">Power User Details</Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField
                label="Code"
                fullWidth
                value={formData.code}
                name="code"
                onChange={handleChange}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Name" fullWidth value={formData.name} name="name" onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={adminOptions}
                getOptionLabel={(option) => `${option.name} -( ${option.user} )`}
                value={selectedAdmin}
                onChange={handleAdminChange}
                renderInput={(params) => <TextField {...params} label="Parent Super Admin" fullWidth />}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Generate Password */}
        <Grid item xs={12} mb={3} sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Button variant="outlined" startIcon={<Iconify icon="material-symbols:refresh" />} onClick={handleGeneratePassword}>
            Generate Password
          </Button>
        </Grid>

        {/* Password */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Password" fullWidth value={formData.password} name="password" onChange={handleChange} />
            </Grid>
          </Grid>
        </Box>

        {/* Note / Info */}
        <Box mb={2} p={2} sx={{ backgroundColor: 'background.neutral', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            * Power User operates as a subsidiary of Super Admin with restricted page access and redacted client information.
            Share, balance, and commissions are automatically set to 0%.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Create Power User
        </Button>
      </DialogActions>
    </Dialog>
  );
}
