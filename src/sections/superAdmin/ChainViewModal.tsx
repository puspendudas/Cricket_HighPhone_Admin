import React, { useState, useEffect } from 'react';

import {
  Box,
  Chip,
  Dialog,
  Button,
  Avatar,
  Divider,
  Skeleton,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
} from '@mui/material';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { Iconify } from 'src/components/iconify';

export interface ChainNode {
  _id: string;
  user_name: string;
  name: string;
  type: string;
  roleTitle: string;
  wallet: number;
  exposure: number;
  status: string;
  isTarget?: boolean;
  isLoggedInUser?: boolean;
}

interface ChainViewModalProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  memberName?: string;
  memberUser?: string;
}

export function ChainViewModal({
  open,
  onClose,
  memberId,
  memberName,
  memberUser,
}: ChainViewModalProps) {
  const { get } = useApi();
  const [chain, setChain] = useState<ChainNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !memberId) return;

    const fetchChain = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await get(`${Endpoints.HierarchyChain}/${memberId}`);
        if (res?.data && Array.isArray(res.data)) {
          setChain(res.data);
        } else {
          setChain([]);
        }
      } catch (err: any) {
        console.error('Error fetching hierarchy chain:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load hierarchy chain');
      } finally {
        setLoading(false);
      }
    };

    fetchChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memberId]);

  // The chain from backend is: [Target (index 0), Parent (index 1), ... LoggedIn (last index)]
  // For top-down display (Root/LoggedIn down to Selected):
  const topDownChain = [...chain].reverse();

  const getRoleColor = (type: string) => {
    switch (type) {
      case 'super_admin':
        return '#00A76F';
      case 'admin':
        return '#4CAF50';
      case 'super_master':
        return '#FF8A65';
      case 'master':
        return '#BA68C8';
      case 'super_agent':
        return '#42A5F5';
      case 'agent':
        return '#A1887F';
      case 'user':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  const getRoleIcon = (type: string) => {
    switch (type) {
      case 'super_admin':
        return 'solar:shield-star-bold-duotone';
      case 'admin':
        return 'solar:user-speak-rounded-bold-duotone';
      case 'super_master':
      case 'master':
        return 'solar:users-group-two-rounded-bold-duotone';
      case 'super_agent':
      case 'agent':
        return 'solar:user-hand-up-bold-duotone';
      case 'user':
        return 'solar:user-bold-duotone';
      default:
        return 'solar:user-rounded-bold-duotone';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.darker', width: 36, height: 36 }}>
            <Iconify icon="material-symbols:account-tree-outline" width={22} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Upstream Hierarchy Chain
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {memberName || memberUser ? `${memberName || ''} (${memberUser || ''})` : 'Hierarchy view'}
            </Typography>
          </Box>
        </Box>
        <IconButton aria-label="close" onClick={onClose} size="small">
          <Iconify icon="eva:close-fill" width={20} />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {loading && (
          <Box py={2}>
            {[1, 2, 3].map((n) => (
              <Box key={n} display="flex" gap={2} mb={2} alignItems="center">
                <Skeleton variant="circular" width={40} height={40} />
                <Box flex={1}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={18} />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {error && !loading && (
          <Box textAlign="center" py={4}>
            <Iconify icon="material-symbols:error-outline-rounded" width={48} color="error.main" />
            <Typography variant="body1" color="error" mt={1}>
              {error}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              This user may not belong to your downstream hierarchy.
            </Typography>
          </Box>
        )}

        {!loading && !error && chain.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No hierarchy chain information found.
            </Typography>
          </Box>
        )}

        {!loading && !error && topDownChain.length > 0 && (
          <Box>
            <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                Upstream to Downstream Flow
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={`${topDownChain.length} Levels in Chain`}
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
              />
            </Box>

            <Box position="relative">
              {topDownChain.map((node, index) => {
                const isLast = index === topDownChain.length - 1;
                const roleColor = getRoleColor(node.type);

                return (
                  <Box key={node._id} position="relative" mb={isLast ? 0 : 2}>
                    {/* Vertical Connector Line */}
                    {!isLast && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 20,
                          top: 42,
                          bottom: -16,
                          width: 2,
                          bgcolor: 'divider',
                          zIndex: 0,
                        }}
                      />
                    )}

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: { xs: 1.5, sm: 2 },
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: node.isTarget
                          ? 'primary.main'
                          : node.isLoggedInUser
                          ? 'success.light'
                          : 'divider',
                        bgcolor: node.isTarget
                          ? 'primary.lighter'
                          : node.isLoggedInUser
                          ? 'success.lighter'
                          : 'background.paper',
                        boxShadow: node.isTarget ? '0 2px 8px rgba(0, 167, 111, 0.15)' : 'none',
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          bgcolor: roleColor,
                          width: 40,
                          height: 40,
                          color: '#fff',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        }}
                      >
                        <Iconify icon={getRoleIcon(node.type)} width={22} />
                      </Avatar>

                      {/* User Info */}
                      <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {node.name || node.user_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{node.user_name}
                          </Typography>
                          {node.isLoggedInUser && (
                            <Chip
                              size="small"
                              label="You (Logged In)"
                              color="success"
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                            />
                          )}
                          {node.isTarget && (
                            <Chip
                              size="small"
                              label="Selected"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                            />
                          )}
                        </Box>

                        <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                          <Chip
                            size="small"
                            label={node.roleTitle || node.type}
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: `${roleColor}22`,
                              color: roleColor,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            Bal: ₹{Number(node.wallet || 0).toLocaleString()}
                          </Typography>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: node.status === 'Active' ? 'success.main' : 'error.main',
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: node.status === 'Active' ? 'success.main' : 'error.main',
                              fontWeight: 600,
                            }}
                          >
                            {node.status}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <Box p={2} pt={0} display="flex" justifyContent="flex-end">
        <Button onClick={onClose} variant="contained" color="inherit" sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </Box>
    </Dialog>
  );
}

export default ChainViewModal;
