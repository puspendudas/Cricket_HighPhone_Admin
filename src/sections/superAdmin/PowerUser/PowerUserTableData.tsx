// src/sections/superAdmin/PowerUser/PowerUserTableData.tsx
import type { Member, Updatepaylod, MemberFormData, AdminPermissions } from 'src/Interface/admin.interface';

import React, { useState, useEffect, useCallback } from 'react';

import {
  Box, Menu, Grid, Table, Paper, Button, TableRow, MenuItem, TableBody,
  TableCell, TableHead, TextField, IconButton, FormControl, InputAdornment,
  TablePagination,
} from '@mui/material';

import { decrypt } from 'src/utils/encryption';

import useAdminApi from 'src/Api/admin_api/useAdminApi';
import useActionApi from 'src/Api/actionApi/useActionApi';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { DeactivateModal } from '../Admin/DeactivateModal';
import { EditAdminModal } from '../Admin/EditAdminModal';
import { CreatePowerUserModal } from './CreatePowerUserModal';
import { EditPowerUserPermissionsModal } from './EditPowerUserPermissionsModal';
import { ChainViewModal } from '../ChainViewModal';

export function PowerUserTableData() {
  const { addadmin, fetchPowerUserList, updateAdmin } = useAdminApi();
  const { deactivate } = useActionApi();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [chainViewModal, setChainViewModal] = useState(false);
  const [chainMember, setChainMember] = useState<{ id: string; name: string; user: string } | null>(null);

  const [modals, setModals] = useState({
    edit: false,
    create: false,
    deactivate: false,
    permissions: false,
  });

  const [modalState, setModalState] = useState({
    userToDeactivate: '',
  });

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetchPowerUserList();
      const adminList = response?.admin || [];
      const formatted: Member[] = adminList.map((a: any, i: number) => ({
        id: i + 1,
        _id: a._id,
        user: a.user_name || '',
        name: a.name || '',
        password: decrypt(a.password, 10) || '',
        admin: '0%',
        superAdmin: '0%',
        currentBal: '₹0.00',
        superAdminwallet: `₹${a.parent_id?.wallet || 0}`,
        match: '0%',
        session: '0%',
        casino: '0%',
        code: a.agent_code || a.user_name || '',
        status: a.status ? 'Active' : 'Inactive',
        share: 0,
        matchCommission: 0,
        sessionCommission: 0,
        casinoCommission: 0,
        wallet: 0,
        parentWallet: a.parent_id?.wallet || 0,
        permissions: a.permissions || {
          rollback_match: false,
          cancel_match: false,
          rollback_session: false,
          cancel_session: false,
        },
      }));
      setMembers(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (form: MemberFormData) => {
    try {
      await addadmin({
        user_name: form.code,
        name: form.name,
        password: form.password,
        mobile: form.mobile,
        type: 'power_user',
        share: 0,
        match_commission: 0,
        session_commission: 0,
        casino_commission: 0,
        wallet: 0,
        exposure: 0,
        parent_id: form.parent_id,
        status: form.status,
        permissions: form.permissions,
      });

      await fetchMembers();
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const handleSavePermissions = async (updatedPermissions: AdminPermissions) => {
    if (!selectedMember) return;
    try {
      await updateAdmin(selectedMember._id, {
        permissions: updatedPermissions,
      });
      toast.success('Permissions updated successfully');
      await fetchMembers();
    } catch (err) {
      console.error('Failed to update permissions:', err);
      toast.error('Failed to update permissions');
    }
  };

  const filtered = members.filter(({ name, user }) =>
    (name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const currentRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>, member: Member) => {
    setAnchorEl(e.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditSave = async (updatedData: Updatepaylod) => {
    if (!selectedMember) return;
    try {
      await updateAdmin(selectedMember._id, {
        ...updatedData,
        share: 0,
        match_commission: 0,
        session_commission: 0,
        casino_commission: 0,
      });
      await fetchMembers();
      setModals((p) => ({ ...p, edit: false }));
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  return (
    <Paper sx={{ p: 2, boxShadow: 3 }}>
      <Grid container spacing={2} mb={2} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={8} container justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
          <Button
            color="primary"
            variant="contained"
            startIcon={<Iconify icon="material-symbols:person-add-outline" />}
            onClick={() => setModals((p) => ({ ...p, create: true }))}
          >
            Add Power User
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {["", "Action", "#", "Code", "Name", "Password", "Role", "Status"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentRows.length > 0 ? (
              currentRows.map((member, index) => (
                <TableRow
                  key={member.id}
                  hover
                  sx={{
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                    '&:hover': { backgroundColor: '#f1f1f1' },
                  }}
                >
                  <TableCell>
                    {member.status === 'Inactive' && (
                      <Iconify icon="mdi:account-off" color="red" width={20} />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuClick(e, member)}>
                      <Iconify icon="material-symbols:more-vert" />
                    </IconButton>
                  </TableCell>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{member.user}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.password}</TableCell>
                  <TableCell>Power User</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: member.status === 'Active' ? 'success.light' : 'error.light',
                        color: member.status === 'Active' ? 'success.dark' : 'error.dark',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                      }}
                    >
                      {member.status}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No Power Users Found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filtered.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            setModals((p) => ({ ...p, edit: true }));
            handleMenuClose();
          }}
        >
          <Iconify icon="eva:edit-2-outline" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedMember) {
              setModalState((p) => ({
                ...p,
                userToDeactivate: selectedMember.user,
              }));
              setModals((p) => ({ ...p, deactivate: true }));
            }
            handleMenuClose();
          }}
        >
          <Iconify
            icon={
              selectedMember?.status === 'Active'
                ? 'material-symbols:person-alert-outline-rounded'
                : 'material-symbols:person-check-outline-rounded'
            }
            sx={{ mr: 1 }}
          />
          {selectedMember?.status === 'Active' ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!selectedMember) return;

            const loginDetails = `
https://cricket.testingexch.com/
UserName: ${selectedMember.user}
Password: ${selectedMember.password}
`;

            navigator.clipboard.writeText(loginDetails.trim())
              .then(() => {
                toast.success(`Login details copied for ${selectedMember.name}`);
              })
              .catch((err) => {
                console.error('Failed to copy:', err);
                toast.error('Failed to copy login details');
              });

            handleMenuClose();
          }}
        >
          <Iconify icon="material-symbols:key-outline" sx={{ mr: 1 }} /> Send Login Detail
        </MenuItem>
        <MenuItem
          onClick={() => {
            setModals((p) => ({ ...p, permissions: true }));
            handleMenuClose();
          }}
        >
          <Iconify icon="material-symbols:security" sx={{ mr: 1 }} /> Permissions
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedMember) {
              setChainMember({ id: selectedMember._id, name: selectedMember.name, user: selectedMember.user });
              setChainViewModal(true);
            }
            handleMenuClose();
          }}
        >
          <Iconify icon="material-symbols:account-tree-outline" sx={{ mr: 1 }} /> Chain View
        </MenuItem>
      </Menu>

      <CreatePowerUserModal
        open={modals.create}
        onClose={() => setModals((p) => ({ ...p, create: false }))}
        onSubmit={handleCreate}
      />

      <EditAdminModal
        open={modals.edit}
        onClose={() => setModals((p) => ({ ...p, edit: false }))}
        onSubmit={handleEditSave}
        memberData={
          selectedMember
            ? {
                id: selectedMember._id,
                share: 0,
                code: selectedMember.user,
                name: selectedMember.name,
                password: selectedMember.password,
                status: selectedMember.status as 'Active' | 'Inactive',
                matchCommission: 0,
                sessionCommission: 0,
                casinoCommission: 0,
              }
            : null
        }
      />

      <EditPowerUserPermissionsModal
        open={modals.permissions}
        onClose={() => setModals((p) => ({ ...p, permissions: false }))}
        powerUser={selectedMember}
        onSave={handleSavePermissions}
      />

      <DeactivateModal
        open={modals.deactivate}
        userName={modalState.userToDeactivate}
        isActive={selectedMember?.status === 'Active'}
        onClose={() => setModals((p) => ({ ...p, deactivate: false }))}
        onConfirm={async () => {
          if (!selectedMember) return;
          try {
            await deactivate(selectedMember._id, selectedMember.status !== 'Active');
            await fetchMembers();
          } catch (err) {
            console.error('Status toggle error:', err);
          }
        }}
      />

      <ChainViewModal
        open={chainViewModal}
        onClose={() => {
          setChainViewModal(false);
          setChainMember(null);
        }}
        memberId={chainMember?.id || ''}
        memberName={chainMember?.name}
        memberUser={chainMember?.user}
      />
    </Paper>
  );
}
