import type { Member, MemberFormData } from 'src/Interface/super_master.interface';

import { useQuery } from '@tanstack/react-query';
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
  InputAdornment,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useSuperAdminApi from 'src/Api/super_master_api/useSuperMasterApi';

import { Iconify } from 'src/components/iconify';

interface CreateMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
}

interface MemberFormState {
  code: string;
  name: string;
  password: string;
  status: string;
  share: string;
  matchCommission: string;
  sessionCommission: string;
  casinoCommission: string;
  type: string;
  wallet: string;
  exposure: number | string;
  parent_id?: string;
}

const INITIAL_FORM_STATE: MemberFormState = {
  code: '',
  name: '',
  password: '',
  status: 'Active',
  share: '0',
  matchCommission: '0',
  sessionCommission: '0',
  casinoCommission: '0',
  type: 'super_master',
  wallet: '0',
  exposure: 0,
};

export function CreateMemberModal({ open, onClose, onSubmit }: CreateMemberModalProps) {
  const { fetchAdmin, GetSuperMastertid } = useSuperAdminApi();
  const { fetchMe } = useMeApi();

  // TanStack Query for current user data
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchMe,
    enabled: open,
  });

  const [adminOptions, setAdminOptions] = useState<Member[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Member | null>(null);
  const [selectedAdminWallet, setSelectedAdminWallet] = useState(0);
  // Track selected admin's share limit
  const [selectedAdminShare, setSelectedAdminShare] = useState<number>(90);

  const [formData, setFormData] = useState<MemberFormState>(INITIAL_FORM_STATE);

  const resetForm = () => {
    setSelectedAdmin(null);
    setSelectedAdminWallet(0);
    setSelectedAdminShare(90);
    setFormData(INITIAL_FORM_STATE);
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
          share: admin.share || 0, // Added share to the formatted data
        }));
        setAdminOptions(formatted);
      } catch (err) {
        console.error('Failed to fetch admins', err);
      }
    };

    const loadAdminId = async () => {
      try {
        const res = await GetSuperMastertid();
        if (res?.user_name) {
          setFormData((prev: MemberFormState) => ({
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

      // If user is admin, automatically set themselves as parent
      if (userData.type === 'admin') {
        const currentUserAsParent: Member = {
          id: 1,
          user: userData.user_name,
          name: userData.name,
          _id: userData._id,
          currentBal: `₹${userData.wallet || 0}`,
          share: userData.share || 0,
          password: '',
          admin: '',
          superAdmin: '',
          superMasterWallet: '',
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
        setSelectedAdminWallet(userData.wallet || 0);

        setFormData((prev: MemberFormState) => ({
          ...prev,
          share: String(userData.share || 0),
          matchCommission: String(userData.match_commission || 0),
          sessionCommission: String(userData.session_commission || 0),
          casinoCommission: String(userData.casino_commission || 0),
          // wallet: userData.wallet || 0, // REMOVED - wallet should remain 0
          exposure: 0,
          parent_id: userData._id,
        }));
      } else {
        // For other users, set defaults but don't auto-select parent
        setFormData((prev: MemberFormState) => ({
          ...prev,
          share: String(userData.share || 0),
          matchCommission: String(userData.match_commission || 0),
          sessionCommission: String(userData.session_commission || 0),
          casinoCommission: String(userData.casino_commission || 0),
          // wallet: userData.wallet || 0, // REMOVED - wallet should remain 0
          exposure: 0,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: MemberFormState) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const maxShare = getMaxShare();
    if (/^\d*$/.test(value) && Number(value || 0) <= maxShare) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        share: value,
      }));
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData((prev: MemberFormState) => ({
      ...prev,
      password: newPassword,
    }));
  };

  const handleSubmit = () => {
    const payload: MemberFormData = {
      ...formData,
      wallet: Number(formData.wallet || 0),
      share: Number(formData.share || 0),
      matchCommission: Number(formData.matchCommission || 0),
      sessionCommission: Number(formData.sessionCommission || 0),
      casinoCommission: Number(formData.casinoCommission || 0),
      exposure: Number(formData.exposure || 0),
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
      setSelectedAdminShare(newValue.share || 0); // Set the selected admin's share limit
      setFormData((prev: MemberFormState) => ({
        ...prev,
        // wallet: adminWallet, // REMOVED - wallet should not auto-set
        share: '0',
        parent_id: newValue._id,
      }));
    } else {
      setSelectedAdminWallet(0);
      setSelectedAdminShare(90); // Reset to default max share when no admin is selected
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '0',
        share: '0',
        parent_id: undefined,
      }));
    }
  };

  // For admin, we show disabled input with their own info
  const shouldShowParentSelection = currentUser?.data?.type !== 'admin';

  // Get max share based on user type
  const getMaxShare = () => {
    if (currentUser?.data?.type === 'admin') {
      return currentUser.data.share || 0;
    }
    return selectedAdminShare;
  };

  // Get max wallet based on user type
  const getMaxWallet = () => {
    if (currentUser?.data?.type === 'admin') {
      return currentUser.data.wallet || 0;
    }
    return selectedAdminWallet;
  };

  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === '') {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '',
      }));
      return;
    }
    if (!/^\d*$/.test(value)) {
      return;
    }
    const numericValue = Number(value);
    const maxWallet = getMaxWallet();
    const isParentAdmin = currentUser?.data?.type === 'admin';

    if (isParentAdmin || selectedAdmin) {
      if (maxWallet > 0) {
        if (numericValue <= maxWallet) {
          setFormData((prev: MemberFormState) => ({
            ...prev,
            wallet: value,
          }));
        }
      } else if (maxWallet === 0) {
        if (numericValue === 0) {
          setFormData((prev: MemberFormState) => ({
            ...prev,
            wallet: value,
          }));
        }
      }
    } else {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: value,
      }));
    }
  };

  const handleWalletBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value === '') {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '0',
      }));
      return;
    }
    const numericValue = Number(value);
    const maxWallet = getMaxWallet();
    const isParentAdmin = currentUser?.data?.type === 'admin';

    if (Number.isNaN(numericValue) || numericValue < 0) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '0',
      }));
    } else if ((isParentAdmin || selectedAdmin) && maxWallet > 0 && numericValue > maxWallet) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: String(maxWallet),
      }));
    } else if ((isParentAdmin || selectedAdmin) && maxWallet === 0 && numericValue !== 0) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '0',
      }));
    }
  };

  // Get wallet helper text based on user type
  const getWalletHelperText = () => {
    if (currentUser?.data?.type === 'admin') {
      return `Your wallet: ₹${currentUser.data.wallet || 0} (Max: ₹${currentUser.data.wallet || 0})`;
    }
    return selectedAdmin
      ? `Admin's wallet: ₹${selectedAdminWallet} (Max: ₹${selectedAdminWallet})`
      : '';
  };

  // Get share helper text based on user type
  const getShareHelperText = () => {
    if (currentUser?.data?.type === 'admin') {
      return currentUser.data.share?.toString() || '0';
    }
    return selectedAdmin
      ? selectedAdminShare.toString()
      : '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Super Master</DialogTitle>
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
                    <TextField {...params} label="Select Admin" fullWidth />
                  )}
                />
              </Grid>
            ) : (
              // For admin, show disabled input with their info
              <Grid item xs={12}>
                <TextField
                  label="Admin"
                  fullWidth
                  value={
                    selectedAdmin
                      ? `${selectedAdmin.name} - (${selectedAdmin.user})`
                      : currentUser
                        ? `${currentUser.data.name} - (${currentUser.data.user})`
                        : ''
                  }
                  disabled
                  helperText="You are the parent admin"
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
                  type="text"
                  onChange={handleWalletChange}
                  onBlur={handleWalletBlur}
                  helperText={getWalletHelperText()}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{
                    inputMode: 'numeric',
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
                type="text"
                onChange={handleShareChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ inputMode: 'numeric' }}
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
                type="text"
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ inputMode: 'numeric' }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Session Commission"
                fullWidth
                value={formData.sessionCommission}
                name="sessionCommission"
                type="text"
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ inputMode: 'numeric' }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Casino Commission"
                fullWidth
                value={formData.casinoCommission}
                name="casinoCommission"
                type="text"
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{ inputMode: 'numeric' }}
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
        <Button onClick={handleSubmit} color="primary" variant="contained">Add Super Master</Button>
      </DialogActions>
    </Dialog>
  );
}