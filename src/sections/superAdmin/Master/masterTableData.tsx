// src/components/AdminTableData.tsx
import type { Member, Updatepaylod, MemberFormData } from 'src/Interface/master.interface';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box, Menu, Grid, Table, Paper, Button, TableRow, MenuItem, TableBody,
  TableCell, TableHead, TextField, IconButton, FormControl, InputAdornment,
  TablePagination,
} from '@mui/material';

import useActionApi from 'src/Api/actionApi/useActionApi';
import useSuperAdminApi from 'src/Api/master_api/useMasterApi';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import LimitWDModal from './LimitWDModal';
import { EditAdminModal } from './EditAdminModal';
import { DeactivateModal } from './DeactivateModal';
import { CreateMemberModal } from './CreateMemberModal';
import { LimitUpdatesModal } from './LimitUpdatesModal';

export function MasterTableData() {
  const { addMaster, fetchMasterList, updateMaster } = useSuperAdminApi();
  const { deactivate, LimitTransaction } = useActionApi();

  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const [modals, setModals] = useState({
    edit: false,
    create: false,
    deactivate: false,
    wdLimit: false,
    updateLimit: false,
  });

  const [modalState, setModalState] = useState({
    userToDeactivate: '',
    memberForWD: null as Member | null,
    memberForLimitUpdates: '',
    memberForLimitUpdatesId: '',
  });

  const fetchMembers = useCallback(async () => {
    try {
      const { admin } = await fetchMasterList();
      const formatted: Member[] = admin.map((a: any, i: number) => ({
        id: i + 1,
        _id: a._id,
        user: a.user_name || '',
        parent_id: a.parent_id?._id || '',
        name: a.name || '',
        password: decrypt(a.password, 10) || '',
        admin: `${a.share}%`,
        superAdmin: `${(a.parent_id?.share || 0) - (a.share || 0)}%`,
        currentBal: `₹${Number(a.wallet ?? 0).toFixed(2)}`,

        masterwallet: `₹${a.parent_id.wallet}`,
        match: `${a.match_commission}%`,
        session: `${a.session_commission}%`,
        casino: `${a.casino_commission}%`,
        code: a.agent_code || '',
        status: a.status ? 'Active' : 'Inactive',
        share: a.share,
        matchCommission: a.match_commission,
        sessionCommission: a.session_commission,
        casinoCommission: a.casino_commission,
        wallet: a.wallet,
        parentWallet: a.parent_id?.wallet || 0,
      }));
      if (id) {
        const matched = formatted.filter(
          (m: any) => m._id === id || m.parent_id === id
        );
        setMembers(matched);
      } else {
        setMembers(formatted);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);




  const decrypt = (text: string, shift: number): string =>
    encrypt(text, (95 - shift) % 95);

  const encrypt = (text: string, shift: number): string => {
    let result = '';
    for (let i = 0; i < text.length; i += 1) {
      const charCode = text.charCodeAt(i);
      if (charCode >= 32 && charCode <= 126) {
        result += String.fromCharCode(((charCode - 32 + shift) % 95) + 32);
      } else {
        result += text.charAt(i);
      }
    }
    return result;
  };
  const handleCreate = async (form: MemberFormData) => {
    try {
      await addMaster({
        user_name: form.code,
        name: form.name,
        password: form.password,
        // mobile: form.mobile,
        type: form.type,
        share: form.share,
        match_commission: form.matchCommission,
        session_commission: form.sessionCommission,
        casino_commission: form.casinoCommission,
        wallet: form.wallet,
        exposure: form.exposure,
        parent_id: form.parent_id,
        status: form.status
      });

      await fetchMembers();
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const filtered = members.filter(({ name, admin }) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.toLowerCase().includes(searchTerm.toLowerCase())
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
      await updateMaster(selectedMember._id, updatedData);
      await fetchMembers();
      setModals(p => ({ ...p, edit: false }));
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
            color='primary'
            variant="contained"
            startIcon={<Iconify icon="material-symbols:person-add-outline" />}
            onClick={() => setModals((p) => ({ ...p, create: true }))}
          >
            Add Master
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {["", "Action", "#", "User", "Name", "Password", "Master", "Super Master", "Current Bal",
                // "Super Agent",
                "Match", "Session", "Casino",].map((h) => (
                  <TableCell key={h}>{h}</TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentRows.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  {member.status === 'Inactive' && (
                    <Iconify
                      icon="mdi:account-off"
                      color="red"
                      width={20}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={(e) => handleMenuClick(e, member)}>
                    <Iconify icon="material-symbols:more-vert" />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={selectedMember?.id === member.id && Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={() => {
                      setModals(p => ({ ...p, edit: true }));
                      setAnchorEl(null);
                    }}>
                      <Iconify icon="eva:edit-2-outline" sx={{ mr: 1 }} /> Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setModalState((p) => ({ ...p, userToDeactivate: member.name }));
                        setModals((p) => ({ ...p, deactivate: true }));
                        handleMenuClose();
                      }}
                    >
                      <Iconify
                        icon={
                          member.status === 'Active'
                            ? 'material-symbols:person-alert-outline-rounded'
                            : 'material-symbols:person-check-outline-rounded'
                        }
                        sx={{ mr: 1 }}
                      />
                      {member.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </MenuItem>
                    <MenuItem onClick={() => { setModalState(p => ({ ...p, memberForLimitUpdates: member.name, memberForLimitUpdatesId: member._id })); setModals(p => ({ ...p, updateLimit: true })); handleMenuClose(); }}>
                      <Iconify icon="raphael:view" sx={{ mr: 1 }} /> Limit Updates
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        if (!selectedMember) return;

                        const loginDetails = `
https://cricket.highphone11.com/
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
                    <MenuItem onClick={() => { setModalState(p => ({ ...p, memberForWD: member })); setModals(p => ({ ...p, wdLimit: true })); handleMenuClose(); }}>
                      <Iconify icon="material-symbols:folder-limited-outline-sharp" sx={{ mr: 1 }} /> Limit W/D
                    </MenuItem>
                  </Menu>
                </TableCell>
                <TableCell>{member.id}</TableCell>
                <TableCell
                  sx={{ color: 'primary.main', cursor: 'pointer' }}
                  onClick={() => navigate(`/master/super-agent/${member._id}`)}
                >
                  {member.user}
                </TableCell>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.password}</TableCell>
                <TableCell>{member.admin}</TableCell>
                <TableCell>{member.superAdmin}</TableCell>
                <TableCell>{member.currentBal}</TableCell>
                {/* <TableCell>{member.masterwallet}</TableCell> */}
                <TableCell>{member.match}</TableCell>
                <TableCell>{member.session}</TableCell>
                <TableCell>{member.casino}</TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <TablePagination
        rowsPerPageOptions={[10, 20, 25]}
        component="div"
        count={filtered.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />

      {/* Modals */}
      {selectedMember && (
        <EditAdminModal
          open={modals.edit}
          onClose={() => setModals((prev) => ({ ...prev, edit: false }))}
          memberData={{
            id: selectedMember._id,
            code: selectedMember.user,
            name: selectedMember.name,
            password: selectedMember.password,
            status: selectedMember.status as 'Active' | 'Inactive',
            matchCommission: selectedMember.matchCommission,
            sessionCommission: selectedMember.sessionCommission,
            casinoCommission: selectedMember.casinoCommission,
            share: selectedMember.share,
          }}
          onSubmit={handleEditSave}
        />
      )}
      <CreateMemberModal
        open={modals.create}
        onClose={() => setModals(p => ({ ...p, create: false }))}
        onSubmit={handleCreate}
      />

      <DeactivateModal
        open={modals.deactivate}
        onClose={() => setModals(p => ({ ...p, deactivate: false }))}
        onConfirm={async () => {
          if (selectedMember?._id) {
            const newStatus = selectedMember.status === 'Inactive';
            await deactivate(selectedMember._id, newStatus);
            await fetchMembers();
            setSelectedMember(null);
          }
        }}
        userName={modalState.userToDeactivate}
        isActive={selectedMember?.status === 'Active'}
      />

      {modalState.memberForWD && (
        <LimitWDModal
          open={modals.wdLimit}
          onClose={() => setModals(p => ({ ...p, wdLimit: false }))}
          onSubmit={async (amount, type) => {
            if (!modalState.memberForWD?._id) return;
            await LimitTransaction(modalState.memberForWD._id, amount, type);
            await fetchMembers(); // refresh after update
          }}
          currentWithdrawal={modalState.memberForWD.wallet}
          currentDeposit={modalState.memberForWD.parentWallet || 0}
        />
      )}

      <LimitUpdatesModal
        open={modals.updateLimit}
        onClose={() => setModals(p => ({ ...p, updateLimit: false }))}
        userName={modalState.memberForLimitUpdates}
        userId={modalState.memberForLimitUpdatesId}
      />
    </Paper>
  );
}


