import type { Member, MemberFormData } from 'src/Interface/admin.interface';

import { useState, useEffect } from 'react';

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
  InputAdornment,
} from '@mui/material';

import useAdminApi from 'src/Api/admin_api/useAdminApi';

import { Iconify } from 'src/components/iconify';

interface CreateMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
}

export function CreateMemberModal({ open, onClose, onSubmit }: CreateMemberModalProps) {
  const { fetchAdmin, GetAdminid } = useAdminApi();

  const [adminOptions, setAdminOptions] = useState<Member[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Member | null>(null);
  const [selectedAdminWallet, setSelectedAdminWallet] = useState(0);
  // Track selected super-admin's share limit
  const [selectedAdminShare, setSelectedAdminShare] = useState<number>(90);
  const resetForm = () => {
    setSelectedAdmin(null);
    setSelectedAdminWallet(0);
    setSelectedAdminShare(90);

    setFormData({
      code: '',
      name: '',
      password: '',
      status: 'Active',
      share: 0,
      matchCommission: 0,
      sessionCommission: 0,
      casinoCommission: 0,
      mobile: '8005753265',
      type: 'admin',
      wallet: 0,
      exposure: 0,
    });
  };

  const [formData, setFormData] = useState<MemberFormData>({
    code: '',
    name: '',
    password: '',
    status: 'Active',
    share: 0,
    matchCommission: 0,
    sessionCommission: 0,
    casinoCommission: 0,
    mobile: '8005753265',
    type: 'admin',
    wallet: 0,
    exposure: 0,
  });

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
      } catch (err) {
        console.error('Failed to fetch admins', err);
      }
    };

    const loadAdminId = async () => {
      try {
        const res = await GetAdminid();
        if (res?.user_name) {
          setFormData((prev) => ({
            ...prev,
            code: res.user_name,
          }));
        }
      } catch (err) {
        console.error('Failed to get admin id', err);
      }
    };

    if (open) {
      loadAdmins();
      loadAdminId();
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value),
      }));
    }
  };

  const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (/^\d*$/.test(value) && Number(value) <= selectedAdminShare) {
      setFormData((prev) => ({
        ...prev,
        share: value === '' ? 0 : Number(value),
      }));
    }
  };

  // const handleStatusChange = (event: any, newValue: string | null) => {
  //   if (newValue) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       status: newValue as 'Active' | 'Inactive',
  //     }));
  //   }
  // };

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
      status: formData.status === 'Active',
    };
    onSubmit(payload);
    resetForm();
    onClose();
  };

  const handleAdminChange = (event: any, newValue: Member | null) => {
    setSelectedAdmin(newValue);
    if (newValue) {
      const adminWallet = Number(newValue.currentBal.replace(/[^0-9.-]+/g, ''));
      setSelectedAdminWallet(adminWallet);
      setSelectedAdminShare(newValue.share || 0);
      setFormData((prev) => ({
        ...prev,
        // wallet: adminWallet, // REMOVED - wallet should not auto-set
        share: 0,
        parent_id: newValue._id,
      }));
    } else {
      setSelectedAdminWallet(0);
      setSelectedAdminShare(90);
      setFormData((prev) => ({
        ...prev,
        wallet: 0,
        share: 0,
        parent_id: undefined,
      }));
    }
  };

  // Get share helper text based on user type
  const getShareHelperText = () =>
    selectedAdmin ? selectedAdminShare.toString() : '';


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Admin</DialogTitle>
      <DialogContent>
        {/* Basic Details */}
        <Box mb={3}>
          <Typography variant="subtitle1">User Basic Details</Typography>
          <Grid container spacing={2} mt={1}>
            {/* <Grid item xs={12}>
              <TextField label="Mobile" fullWidth value={formData.mobile} name="mobile" onChange={handleChange} />
            </Grid> */}
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
                renderInput={(params) => <TextField {...params} label="Select Super Admin" fullWidth />}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Generate Password */}
        <Grid item xs={3} mb={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button variant="outlined" startIcon={<Iconify icon="material-symbols:refresh" />} onClick={handleGeneratePassword}>
            Generate Password
          </Button>
        </Grid>

        {/* Password & Status */}
        <Box mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Password" fullWidth value={formData.password} name="password" onChange={handleChange} />
            </Grid>
            {/* <Grid item xs={12}>
              <Autocomplete
                options={['Active', 'Inactive']}
                value={formData.status}
                onChange={handleStatusChange}
                renderInput={(params) => <TextField {...params} label="Status" fullWidth />}
                disableClearable
              />
            </Grid> */}
          </Grid>
        </Box>

        {/* Wallet & Exposure */}
        <Box mb={3}>
          <Typography variant="subtitle1">Account Info</Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <Grid item xs={12}>
                <TextField
                  label="Wallet Amount"
                  fullWidth
                  value={formData.wallet}
                  name="wallet"
                  type="number"
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    // Allow only positive numbers up to selectedAdminWallet
                    const maxAllowed = Math.max(0, selectedAdminWallet); 

                    if (!Number.isNaN(value) && value >= 0 && value <= maxAllowed) {
                      setFormData((prev) => ({ ...prev, wallet: value }));
                    }
                  }}
                  onBlur={(e) => {
                    // Clamp value on blur to ensure it stays within bounds
                    const value = Number(e.target.value);
                    if (Number.isNaN(value) || value < 0) {
                      setFormData((prev) => ({ ...prev, wallet: 0 }));
                    } else if (value > selectedAdminWallet && selectedAdminWallet > 0) {
                      setFormData((prev) => ({ ...prev, wallet: selectedAdminWallet }));
                    }
                  }}
                  helperText={
                    selectedAdmin
                      ? selectedAdminWallet > 0
                        ? `Admin's wallet: ₹${selectedAdminWallet} (Max: ₹${selectedAdminWallet})`
                        : `Admin's wallet: ₹${selectedAdminWallet} (Max: ₹0)`
                      : ''
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                  inputProps={{
                    min: 0,
                    max: selectedAdminWallet > 0 ? selectedAdminWallet : 0
                  }}
                />
              </Grid>
            </Grid>
            {/* <Grid item xs={12}>
              <TextField
                label="Exposure Limit"
                fullWidth
                value={formData.exposure}
                name="exposure"
                type="number"
                onChange={handleNumberChange}
              />
            </Grid> */}
          </Grid>
        </Box>

        {/* Share */}
        <Box mb={3}>
          <Typography variant="subtitle1">
            Share{" "}
            {getShareHelperText() && (
              <Typography component="span" color="error">
                (max {getShareHelperText()}%)
              </Typography>
            )}
          </Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                value={formData.share}
                name="share"
                onChange={handleShareChange}
                helperText={`Admin's share: ${selectedAdminShare}%`}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ min: 0, max: selectedAdminShare }}
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
                value={formData.matchCommission}
                name="matchCommission"
                onChange={handleNumberChange}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Session Commission"
                fullWidth
                value={formData.sessionCommission}
                name="sessionCommission"
                onChange={handleNumberChange}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Casino Commission"
                fullWidth
                value={formData.casinoCommission}
                name="casinoCommission"
                onChange={handleNumberChange}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            resetForm();
            onClose();
          }}
          color="primary"
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">Add Admin</Button>
      </DialogActions>
    </Dialog>
  );
}