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
  FormHelperText,
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useSuperAdminApi from 'src/Api/Client_api/useClientApi';

import { Iconify } from 'src/components/iconify';

interface Member {
  id: number;
  user: string;
  name: string;
  _id: string;
  currentBal: string;
  share: number;
  betting?: number;
  exposure: number;
  parentWallet: number;
  parent_id?: string;
  wallet: number;
  agentName: string;
  password: string;
  admin: string;
  superAdmin: string;
  AgentWallet: string;
  match: string;
  session: string;
  casino: string;
  code: string;
  status: string;
  matchCommission: number;
  sessionCommission: number;
  casinoCommission: number;
}

interface MemberFormData {
  code: string;
  name: string;
  password: string;
  status: boolean;
  share: number;
  matchCommission: number;
  sessionCommission: number;
  casinoCommission: number;
  wallet: number;
  exposure: number;
  agent_id?: string;
  user_name?: string;
}

interface CreateMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
}

export function CreateMemberModal({ open, onClose, onSubmit }: CreateMemberModalProps) {
  const { fetchAgent, GetClientid } = useSuperAdminApi();
  const { fetchMe } = useMeApi();

  const [adminOptions, setAdminOptions] = useState<Member[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Member | null>(null);
  const [selectedAdminWallet, setSelectedAdminWallet] = useState(0);
  const [currentUserType, setCurrentUserType] = useState<string>('');

  // Validation errors state
  const [errors, setErrors] = useState<{ name: string; password: string }>({
    name: '',
    password: '',
  });

  const resetForm = () => {
    setSelectedAdmin(null);
    setSelectedAdminWallet(0);
    setFormData({
      code: '',
      name: '',
      password: '',
      status: true,
      share: 0,
      matchCommission: 0,
      sessionCommission: 0,
      casinoCommission: 0,
      wallet: 0,
      exposure: 0,
    });
    setErrors({
      name: '',
      password: '',
    });
  };

  const [formData, setFormData] = useState<MemberFormData>({
    code: '',
    name: '',
    password: '',
    status: true,
    share: 0,
    matchCommission: 0,
    sessionCommission: 0,
    casinoCommission: 0,
    wallet: 0,
    exposure: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await fetchMe();
        const currentUser = userData?.data;

        if (currentUser) {
          setCurrentUserType(currentUser.type || '');

          if (currentUser.type === 'agent') {
            const currentUserAsAdmin: Member = {
              id: 1,
              user: currentUser.user_name || '',
              name: currentUser.name || '',
              _id: currentUser._id || '',
              currentBal: `₹${currentUser.wallet || 0}`,
              share: currentUser.share || 0,
              betting: undefined,
              exposure: 0,
              parentWallet: 0,
              parent_id: undefined,
              wallet: 0,
              agentName: '',
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
              casinoCommission: 0
            };

            setAdminOptions([currentUserAsAdmin]);
            setSelectedAdmin(currentUserAsAdmin);
            setSelectedAdminWallet(currentUser.wallet || 0);
            setFormData((prev: MemberFormData) => ({
              ...prev,
              share: 0,
              agent_id: currentUser._id,
            }));
          } else {
            const response = await fetchAgent();
            const formatted = response?.admin.map((admin: any, index: number) => ({
              id: index + 1,
              user: admin.user_name || '',
              name: admin.name || '',
              _id: admin._id,
              currentBal: `₹${admin.wallet || 0}`,
            }));
            setAdminOptions(formatted);
          }
        }

        const res = await GetClientid();
        if (res?.user_name) {
          setFormData((prev: MemberFormData) => ({
            ...prev,
            code: res.user_name,
          }));
        }
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };

    if (open) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Validation function
  const validateForm = () => {
    const newErrors = {
      name: '',
      password: '',
    };

    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
      isValid = false;
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    } else if (!/^[0-9]*$/.test(formData.password)) {
      newErrors.password = 'Password must contain only numbers';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (name === 'name' || name === 'password') {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    setFormData((prev: MemberFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setFormData((prev: MemberFormData) => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value),
      }));
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
    setFormData((prev: MemberFormData) => ({
      ...prev,
      password: newPassword,
    }));

    // Clear password error if any
    setErrors(prev => ({
      ...prev,
      password: '',
    }));
  };

  const handleSubmit = () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    const payload: MemberFormData = {
      ...formData,
      user_name: formData.code,
      // status is already boolean (true/false)
    };

    onSubmit(payload);
    resetForm();
    onClose();
  };

  const handleAdminChange = (event: any, newValue: Member | null) => {
    if (currentUserType === 'agent') {
      return;
    }

    setSelectedAdmin(newValue);
    if (newValue) {
      const adminWallet = Number(newValue.currentBal.replace(/[^0-9.-]+/g, ''));
      setSelectedAdminWallet(adminWallet);
      setFormData((prev: MemberFormData) => ({
        ...prev,
        agent_id: newValue._id,
      }));
    } else {
      setSelectedAdminWallet(0);
      setFormData((prev: MemberFormData) => ({
        ...prev,
        agent_id: undefined,
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Client</DialogTitle>
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
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={adminOptions}
                getOptionLabel={(option) => `${option.name} -( ${option.user} )`}
                value={selectedAdmin}
                onChange={handleAdminChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Agent"
                    fullWidth
                    disabled={currentUserType === 'agent'}
                    helperText={currentUserType === 'agent' ? 'Automatically set to your account' : ''}
                  />
                )}
                disabled={currentUserType === 'agent'}
              />
            </Grid>
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
              <TextField
                label="Password"
                fullWidth
                value={formData.password}
                name="password"
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                required
              />
              <FormHelperText sx={{ mt: 1 }}>
                Password must be at least 6 digits and contain only numbers
              </FormHelperText>
            </Grid>
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

                    // Handle negative values first
                    if (!Number.isNaN(value) && value >= 0) {
                      // If agent's wallet is 0, only allow 0
                      if (selectedAdminWallet === 0) {
                        setFormData((prev: MemberFormData) => ({
                          ...prev,
                          wallet: 0,
                        }));
                      }
                      // If agent's wallet > 0, allow up to selectedAdminWallet
                      else if (value <= selectedAdminWallet) {
                        setFormData((prev: MemberFormData) => ({
                          ...prev,
                          wallet: value,
                        }));
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Final validation on blur
                    const value = Number(e.target.value);

                    if (Number.isNaN(value) || value < 0) {
                      setFormData((prev: MemberFormData) => ({
                        ...prev,
                        wallet: 0
                      }));
                    } else if (selectedAdminWallet === 0 && value !== 0) {
                      setFormData((prev: MemberFormData) => ({
                        ...prev,
                        wallet: 0
                      }));
                    } else if (selectedAdminWallet > 0 && value > selectedAdminWallet) {
                      setFormData((prev: MemberFormData) => ({
                        ...prev,
                        wallet: selectedAdminWallet
                      }));
                    }
                  }}
                  helperText={
                    selectedAdmin
                      ? selectedAdminWallet > 0
                        ? `Agent's wallet: ₹${selectedAdminWallet} (Max: ₹${selectedAdminWallet})`
                        : `Agent's wallet: ₹0 (Cannot allocate wallet)`
                      : ''
                  }
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  inputProps={{
                    min: 0,
                    max: selectedAdminWallet > 0 ? selectedAdminWallet : 0,
                  }}
                />
              </Grid>
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
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Add Client
        </Button>
      </DialogActions>
    </Dialog>
  );
}