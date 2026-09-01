import type { Member, MemberFormData } from 'src/Interface/agent.interface';

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
import useSuperAdminApi from 'src/Api/agent_api/useAgnetApi';

import { Iconify } from 'src/components/iconify';

interface CreateMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
}

type UserType = 'super_admin' | 'admin' | 'super_master' | 'master' | 'super_agent' | 'agent';

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
  type: 'agent',
  wallet: '0',
  exposure: 0,
};

export function CreateMemberModal({ open, onClose, onSubmit }: CreateMemberModalProps) {
  const { fetchsuperAdmin, GetAgentid } = useSuperAdminApi();
  const { fetchMe } = useMeApi();

  // TanStack Query for current user data
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchMe,
    enabled: open,
  });

  // TanStack Query for parent options based on current user type
  const { data: parentOptionsData } = useQuery({
    queryKey: ['parentOptions', currentUser?.data?.type],
    queryFn: fetchsuperAdmin,
    enabled: open && currentUser?.data?.type !== 'super_agent',
    select: (response) =>
      response?.admin.map((admin: any, index: number) => ({
        id: index + 1,
        user: admin.user_name || '',
        name: admin.name || '',
        _id: admin._id,
        currentBal: `₹${admin.wallet || 0}`,
        share: admin.share || 0,
        type: admin.type || 'super_agent',
      })) || []
  });

  // TanStack Query for agent ID
  const { data: agentIdData } = useQuery({
    queryKey: ['agentId'],
    queryFn: GetAgentid,
    enabled: open,
  });

  const [selectedParent, setSelectedParent] = useState<Member | null>(null);
  const [selectedParentWallet, setSelectedParentWallet] = useState(0);
  const [selectedParentShare, setSelectedParentShare] = useState<number>(90);

  const [formData, setFormData] = useState<MemberFormState>(INITIAL_FORM_STATE);

  // Determine member type based on current user type
  const getMemberType = (userType: UserType): UserType => {
    switch (userType) {
      case 'super_admin': return 'admin';
      case 'admin': return 'super_master';
      case 'super_master': return 'master';
      case 'master': return 'super_agent';
      case 'super_agent': return 'agent';
      default: return 'agent';
    }
  };

  // Get parent options label based on current user type
  const getParentLabel = (userType: UserType): string => {
    switch (userType) {
      case 'super_admin': return 'Select Admin';
      case 'admin': return 'Select Super Master';
      case 'super_master': return 'Select Master';
      case 'master': return 'Select Super Agent';
      default: return 'Select Super Agent';
    }
  };

  // Set form data based on current user
  useEffect(() => {
    if (open && currentUser?.data) {
      const userData = currentUser.data;
      const memberType = getMemberType(userData.type as UserType);

      // If user is super_agent, automatically set themselves as parent
      if (userData.type === 'super_agent') {
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
          AgentWallet: '',
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

        setSelectedParent(currentUserAsParent);
        setSelectedParentShare(userData.share || 0);
        setSelectedParentWallet(userData.wallet || 0);

        setFormData((prev: MemberFormState) => ({
          ...prev,
          type: memberType,
          share: '0',
          matchCommission: String(userData.match_commission || 0),
          sessionCommission: String(userData.session_commission || 0),
          casinoCommission: String(userData.casino_commission || 0),
          exposure: 0,
          parent_id: userData._id,
        }));
      } else {
        // For other users, set defaults but don't auto-select parent
        setFormData((prev: MemberFormState) => ({
          ...prev,
          share: '0',
          matchCommission: String(userData.match_commission || 0),
          sessionCommission: String(userData.session_commission || 0),
          casinoCommission: String(userData.casino_commission || 0),
          exposure: 0,
        }));
      }
    }
  }, [open, currentUser]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM_STATE);
      setSelectedParent(null);
      setSelectedParentWallet(0);
      setSelectedParentShare(90);
    }
  }, [open]);

  // Set agent code when agentIdData is available
  useEffect(() => {
    if (open && agentIdData?.user_name) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        code: agentIdData.user_name,
      }));
    }
  }, [open, agentIdData]);

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
    const maxShare = currentUser?.data?.type === 'super_agent'
      ? (currentUser.data.share || 0)
      : selectedParentShare;

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
    onClose();
  };

  const handleParentChange = (event: any, newValue: Member | null) => {
    setSelectedParent(newValue);
    if (newValue) {
      const parentWallet = Number(newValue.currentBal.replace(/[^0-9.-]+/g, ''));
      setSelectedParentWallet(parentWallet);
      setSelectedParentShare(newValue.share || 0);
      setFormData((prev: MemberFormState) => ({
        ...prev,
        share: '0', // Set to 0 instead of newValue.share
        parent_id: newValue._id,
      }));
    } else {
      setSelectedParentWallet(0);
      setSelectedParentShare(90);
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '0',
        share: '0',
        parent_id: undefined,
      }));
    }
  };

  // For super_agent, we show disabled input with their own info
  const shouldShowParentSelection = currentUser?.data?.type !== 'super_agent';
  const parentLabel = getParentLabel(currentUser?.data?.type as UserType);

  // Get max share based on user type
  const getMaxShare = () => {
    if (currentUser?.data?.type === 'super_agent') {
      return currentUser.data.share || 0;
    }
    return selectedParentShare;
  };

  // Get max wallet based on user type
  const getMaxWallet = () => {
    if (currentUser?.data?.type === 'super_agent') {
      return currentUser.data.wallet || 0;
    }
    return selectedParentWallet;
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
    const isParentSuperAgent = currentUser?.data?.type === 'super_agent';

    if (isParentSuperAgent || selectedParent) {
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
    const isParentSuperAgent = currentUser?.data?.type === 'super_agent';

    if (Number.isNaN(numericValue) || numericValue < 0) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '0',
      }));
    } else if ((isParentSuperAgent || selectedParent) && maxWallet > 0 && numericValue > maxWallet) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: String(maxWallet),
      }));
    } else if ((isParentSuperAgent || selectedParent) && maxWallet === 0 && numericValue !== 0) {
      setFormData((prev: MemberFormState) => ({
        ...prev,
        wallet: '0',
      }));
    }
  };

  // Get wallet helper text based on user type
  const getWalletHelperText = () => {
    if (currentUser?.data?.type === 'super_agent') {
      return `Your wallet: ₹${currentUser.data.wallet || 0} (Max: ₹${currentUser.data.wallet || 0})`;
    }
    return selectedParent
      ? `${parentLabel.replace('Select ', '')}'s wallet: ₹${selectedParentWallet} (Max: ₹${selectedParentWallet})`
      : '';
  };

  // Get share helper text based on user type
  const getShareHelperText = () => {
    if (currentUser?.data?.type === 'super_agent') {
      return currentUser.data.share?.toString() || '0';
    }
    return selectedParent
      ? selectedParentShare.toString()
      : '';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Agent
      </DialogTitle>
      <DialogContent>
        {/* Basic Details */}
        <Box mb={3}>
          <Typography variant="subtitle1">User Basic Details</Typography>
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
              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                name="name"
                onChange={handleChange}
              />
            </Grid>

            {/* Conditionally render parent selection or disabled display */}
            {shouldShowParentSelection ? (
              <Grid item xs={12}>
                <Autocomplete
                  options={parentOptionsData || []}
                  getOptionLabel={(option) => `${option.name} -( ${option.user} )`}
                  value={selectedParent}
                  onChange={handleParentChange}
                  renderInput={(params) => (
                    <TextField {...params} label={parentLabel} fullWidth />
                  )}
                />
              </Grid>
            ) : (
              // For super_agent, show disabled input with their info
              <Grid item xs={12}>
                <TextField
                  label="Super Agent"
                  fullWidth
                  value={
                    selectedParent
                      ? `${selectedParent.name} - (${selectedParent.user})`
                      : currentUser?.data
                        ? `${currentUser.data.name} - (${currentUser.data.user})`
                        : ''
                  }
                  disabled
                  helperText="You are the parent super agent"
                />
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Generate Password */}
        <Grid item xs={12} mb={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
              <TextField
                label="Password"
                fullWidth
                value={formData.password}
                name="password"
                onChange={handleChange}
              />
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
                helperText={
                  currentUser?.data?.type === 'super_agent'
                    ? `Your share: ${currentUser.data.share || 0}%`
                    : `${parentLabel.replace('Select ', '')}'s share: ${selectedParentShare}%`
                }
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
        <Button onClick={onClose} color="primary">Cancel</Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Add Agent
        </Button>
      </DialogActions>
    </Dialog>
  );
}