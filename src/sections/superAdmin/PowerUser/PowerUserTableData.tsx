// src/sections/superAdmin/PowerUser/PowerUserTableData.tsx
import type { Member, Updatepaylod, MemberFormData } from 'src/Interface/admin.interface';

import React, { useState, useEffect, useCallback } from 'react';

import {
  Box, Menu, Grid, Table, Paper, Button, TableRow, MenuItem, TableBody,
  TableCell, TableHead, TextField, IconButton, FormControl, InputAdornment,
  TablePagination,
} from '@mui/material';

import { decrypt } from 'src/utils/encryption';

import useAdminApi from 'src/Api/admin_api/useAdminApi';
import useActionApi from 'src/Api/actionApi/useActionApi';

import { Iconify } from 'src/components/iconify';

import { DeactivateModal } from '../Admin/DeactivateModal';
import { EditAdminModal } from '../Admin/EditAdminModal';
import { CreatePowerUserModal } from './CreatePowerUserModal';

export function PowerUserTableData() {
  const { addadmin, fetchPowerUserList, updateAdmin } = useAdminApi();
  const { deactivate } = useActionApi();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [modals, setModals] = useState({
    edit: false,
    create: false,
    deactivate: false,
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
      });

      await fetchMembers();
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const filtered = members.filter(({ name, user }) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <TextField
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
        <Grid item xs={12} md={8} container justifyContent="flex-end">
          <Button
            color="primary"
            variant="contained"
            startIcon={<Iconify icon="material-symbols:add" />}
            onClick={() => setModals((p) => ({ ...p, create: true }))}
          >
            Add Power User
          </Button>
        </Grid>
      </Grid>

      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#212B36' }}>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>S.No</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Code</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Password</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currentRows.length > 0 ? (
            currentRows.map((member, index) => (
              <TableRow
                key={member.id}
                sx={{
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                  '&:hover': { backgroundColor: '#f1f1f1' },
                }}
              >
                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell>{member.user}</TableCell>
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
                    }}
                  >
                    {member.status}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, member)}>
                    <Iconify icon="eva:more-vertical-fill" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center">
                No Power Users Found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
          <Iconify icon="material-symbols:edit" sx={{ mr: 1 }} /> Edit
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
                ? 'material-symbols:lock'
                : 'material-symbols:lock-open'
            }
            sx={{ mr: 1 }}
          />
          {selectedMember?.status === 'Active' ? 'Deactivate' : 'Activate'}
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
    </Paper>
  );
}
