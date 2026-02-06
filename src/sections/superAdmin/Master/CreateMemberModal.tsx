import type { Member, MemberFormData } from 'src/Interface/master.interface';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

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

import useMeApi from 'src/Api/me/useMeApi';
import useSuperAdminApi from 'src/Api/master_api/useMasterApi';

import { Iconify } from 'src/components/iconify';

interface CreateMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
}

export function CreateMemberModal({ open, onClose, onSubmit }: CreateMemberModalProps) {
  const { fetchSuperMaster, GetMasterid } = useSuperAdminApi();
  const { fetchMe } = useMeApi();

  // TanStack Query for current user data
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchMe,
    enabled: open,
  });

  const [adminOptions, setAdminOptions] = useState<Member[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Member | null>(null);
  // Track selected admin's share limit
  const [selectedAdminShare, setSelectedAdminShare] = useState<number>(90);
  const resetForm = () => {
    setSelectedAdmin(null);
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
      type: 'master',
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
    // mobile: '8005753265',
    type: 'master',
    wallet: 0,
    exposure: 0,
  });

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await fetchSuperMaster();
        const formatted = response?.admin.map((admin: any, index: number) => ({
          id: index + 1,
          user: admin.user_name || '',
          name: admin.name || '',
          _id: admin._id,
          currentBal: `₹${admin.wallet || 0}`,
          share: admin.share || 0, // include super admin's share limit
        }));
        setAdminOptions(formatted);
      } catch (err) {
        console.error('Failed to fetch super admins', err);
      }
    };

    const loadAdminId = async () => {
      try {
        const res = await GetMasterid();
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
      loadAdminId();
      loadAdmins();
    }

    // Set form data based on current user
    if (open && currentUser?.data) {
      const userData = currentUser.data;

      // If user is super_master, automatically set themselves as parent
      if (userData.type === 'super_master') {
        const currentUserAsParent: Member = {
          id: 1,
          user: userData.user_name,
          user_name: userData.user_name,
          name: userData.name,
          _id: userData._id,
          currentBal: `₹${userData.wallet || 0}`,
          share: userData.share || 0,
          password: '',
          admin: '',
          superAdmin: '',
          masterwallet: '',
          match: '',
          session: '',
          casino: '',
          code: '',
          status: '',
          matchCommission: 0,
          sessionCommission: 0,
          casinoCommission: 0,
          parentWallet: 0,
          parent_id: undefined,
          wallet: 0
        };

        setSelectedAdmin(currentUserAsParent);
        setSelectedAdminShare(userData.share || 0);

        setFormData(prev => ({
          ...prev,
          share: userData.share || 0,
          matchCommission: userData.match_commission || 0,
          sessionCommission: userData.session_commission || 0,
          casinoCommission: userData.casino_commission || 0,
          // wallet: userData.wallet || 0, // REMOVED - wallet should remain 0
          exposure: 0,
          parent_id: userData._id,
        }));
      } else {
        // For other users, set defaults but don't auto-select parent
        setFormData(prev => ({
          ...prev,
          share: userData.share || 0,
          matchCommission: userData.match_commission || 0,
          sessionCommission: userData.session_commission || 0,
          casinoCommission: userData.casino_commission || 0,
          // wallet: userData.wallet || 0, // REMOVED - wallet should remain 0
          exposure: 0,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentUser]);

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
    const maxShare = getMaxShare();
    if (/^\d*$/.test(value) && Number(value) <= maxShare) {
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
      // const adminWallet = Number(newValue.currentBal.replace(/[^0-9.-]+/g, ''));
      setSelectedAdminShare(newValue.share || 0); // update share limit
      setFormData((prev) => ({
        ...prev,
        // wallet: adminWallet, // REMOVED - wallet should not auto-set
        share: 0, // set initial share to super admin's share
        parent_id: newValue._id,
      }));
    } else {
      setSelectedAdminShare(90);
      setFormData((prev) => ({
        ...prev,
        wallet: 0,
        share: 0,
        parent_id: undefined,
      }));
    }
  };

  // For super_master, we show disabled input with their own info
  const shouldShowParentSelection = currentUser?.data?.type !== 'super_master';

  // Get max share based on user type
  const getMaxShare = () => {
    if (currentUser?.data?.type === 'super_master') {
      return currentUser.data.share || 0;
    }
    return selectedAdminShare;
  };

  // Get wallet helper text based on user type
  const getWalletHelperText = () => {
    if (currentUser?.data?.type === 'super_master') {
      return `Your wallet: ₹${currentUser.data.wallet || 0} (Max: ₹${currentUser.data.wallet || 0})`;
    }
    return selectedAdmin
      ? `Super Master's wallet: ₹${Number(selectedAdmin.currentBal.replace(/[^0-9.-]+/g, ''))} (Max: ₹${Number(selectedAdmin.currentBal.replace(/[^0-9.-]+/g, ''))})`
      : '';
  };

  // Get share helper text based on user type
  const getShareHelperText = () => {
    if (currentUser?.data?.type === 'super_master') {
      return currentUser.data.share?.toString() || '0';
    }
    return selectedAdmin
      ? selectedAdminShare.toString()
      : '';
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Master</DialogTitle>
      <DialogContent>
        {/* Basic Details */}
        <Box mb={3}>
          <Typography variant="subtitle1">User Basic Details</Typography>
          <Grid container spacing={2} mt={1}>
            {/* <Grid item xs={12}>
              <TextField label="Mobile" fullWidth value={formData.mobile} name="mobile" onChange={handleChange} />
            </Grid> */}
            <Grid item xs={12}>
              <TextField label="Code" fullWidth value={formData.code} name="code" onChange={handleChange} disabled />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Name" fullWidth value={formData.name} name="name" onChange={handleChange} />
            </Grid>
            {/* Conditionally render parent selection or disabled display */}
            {shouldShowParentSelection ? (
              <Grid item xs={12}>
                <Autocomplete
                  options={adminOptions}
                  getOptionLabel={(option) => `${option.name} -( ${option.user} )`}
                  value={selectedAdmin}
                  onChange={handleAdminChange}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Super Master" fullWidth />
                  )}
                />
              </Grid>
            ) : (
              // For super_master, show disabled input with their info
              <Grid item xs={12}>
                <TextField
                  label="Super Master"
                  fullWidth
                  value={
                    selectedAdmin
                      ? `${selectedAdmin.name} - (${selectedAdmin.user})`
                      : currentUser
                        ? `${currentUser.data.name} - (${currentUser.data.user})`
                        : ''
                  }
                  disabled
                  helperText="You are the parent super master"
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Generate Password */}
        <Grid item xs={3} mb={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="material-symbols:refresh" />}
            onClick={handleGeneratePassword}
          >
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
                    const maxWallet = currentUser?.data?.type === 'super_master'
                      ? (currentUser.data.wallet || 0)
                      : Number(selectedAdmin?.currentBal.replace(/[^0-9.-]+/g, '') || 0);

                    // Fix the validation logic
                    if (!Number.isNaN(value)) {
                      // Handle negative values
                      if (value < 0) {
                        setFormData((prev) => ({
                          ...prev,
                          wallet: 0,
                        }));
                        return;
                      }

                      // If max wallet is 0, only allow 0
                      if (maxWallet === 0) {
                        setFormData((prev) => ({
                          ...prev,
                          wallet: 0,
                        }));
                      }
                      // If max wallet > 0, allow up to maxWallet
                      else if (value <= maxWallet) {
                        setFormData((prev) => ({
                          ...prev,
                          wallet: value,
                        }));
                      }
                      // If value exceeds maxWallet, set to maxWallet
                      else {
                        setFormData((prev) => ({
                          ...prev,
                          wallet: maxWallet,
                        }));
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Final validation on blur
                    const value = Number(e.target.value);
                    const maxWallet = currentUser?.data?.type === 'super_master'
                      ? (currentUser.data.wallet || 0)
                      : Number(selectedAdmin?.currentBal.replace(/[^0-9.-]+/g, '') || 0);

                    if (Number.isNaN(value) || value < 0) {
                      setFormData((prev) => ({ ...prev, wallet: 0 }));
                    } else if (maxWallet === 0 && value !== 0) {
                      setFormData((prev) => ({ ...prev, wallet: 0 }));
                    } else if (maxWallet > 0 && value > maxWallet) {
                      setFormData((prev) => ({ ...prev, wallet: maxWallet }));
                    }
                  }}
                  helperText={getWalletHelperText()}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    max: (() => {
                      const maxWallet = currentUser?.data?.type === 'super_master'
                        ? (currentUser.data.wallet || 0)
                        : Number(selectedAdmin?.currentBal.replace(/[^0-9.-]+/g, '') || 0);
                      return maxWallet > 0 ? maxWallet : 0;
                    })(),
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
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  max: selectedAdminShare,
                }}
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
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Session Commission"
                fullWidth
                value={formData.sessionCommission}
                name="sessionCommission"
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Casino Commission"
                fullWidth
                value={formData.casinoCommission}
                name="casinoCommission"
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
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
        <Button onClick={handleSubmit} color="primary" variant="contained">Add Master</Button>
      </DialogActions>
    </Dialog>
  );
}