// AnnouncementTableData.tsx
import type { Announcement, CreateAnnouncementData, UpdateAnnouncementData } from 'src/Interface/announcement';

import React, { useState, useEffect } from 'react';

import {
  Box,
  Paper,
  Table,
  Alert,
  Button,
  TableRow,
  Snackbar,
  TableHead,
  TableBody,
  TableCell,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import UseAnnouncementApi from 'src/Api/announcementApi/UseAnnouncementApi';

import { Iconify } from 'src/components/iconify';

import AddAnnouncementModal from './AddAnnouncementModal';
import DeleteAnnouncementModal from './DeleteAnnouncementModal';

export function AnnouncementTableData() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  console.log(editModalOpen, '');
  const {
    fetchClientAnnouncementData,
    updateClientAnnouncementData,
    createClientAnnouncementData,
    deleteClientAnnouncementData,
  } = UseAnnouncementApi();

  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const loadAnnouncements = async () => {
  try {
    setLoading(true);
    const responseData = await fetchClientAnnouncementData();

    const mappedAnnouncements = responseData.data.map((item: any) => ({
      id: item._id,
      message: item.body,
      dateTime: new Date(item.createdAt).toLocaleString(),
      recipient: item.user_type,
      match: item.match_id?.eventName || '', 
      status: item.status ? 'Active' : 'Inactive',
    }));

    setAnnouncements(mappedAnnouncements);
  } catch (error) {
    console.log('Failed to fetch announcements:', error);
  } finally {
    setLoading(false);
  }
};

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddAnnouncement = async (data: CreateAnnouncementData) => {
    try {
      await createClientAnnouncementData(data);
      await loadAnnouncements(); 
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to create announcement:', error);
    }
  };


const handleEditSubmit = async (updatedData: UpdateAnnouncementData) => {
  try {
    await updateClientAnnouncementData(updatedData.id, updatedData);

    await loadAnnouncements();
    setEditModalOpen(false);
    setSelectedAnnouncement(null);
  } catch (error) {
    showSnackbar('Failed to update announcement', 'error');
  }
};
  const handleDeleteClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return;

    try {
      await deleteClientAnnouncementData(selectedAnnouncement.id);
      await loadAnnouncements(); // Refresh the list
      setDeleteModalOpen(false);
      setSelectedAnnouncement(null);
      showSnackbar('Announcement deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to delete announcement', 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography variant="h6" fontWeight={600}>
          Announcement List
        </Typography>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="mdi:plus" />}
        >
          Add Announcement
        </Button>
      </div>

      <Table>
        <TableHead sx={{ backgroundColor: '#f9fafb' }}>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Date/Time</TableCell>
            <TableCell>Recipient</TableCell>
            <TableCell>Match</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {announcements.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{item.message}</TableCell>
              <TableCell>{item.dateTime}</TableCell>
              <TableCell>{item.recipient}</TableCell>
              <TableCell>{item.match}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: item.status === 'Active' ? '#e8f5e9' : '#ffebee',
                    color: item.status === 'Active' ? '#4caf50' : '#f44336',
                    '&:hover': {
                      backgroundColor: item.status === 'Active' ? '#c8e6c9' : '#ffcdd2',
                    },
                  }}
                  onClick={() => handleEditSubmit({
                    id: item.id,
                    status: item.status === 'Active' ? 'false' : 'true'
                  })}
                >
                  {item.status}
                </Button>
              </TableCell>
              <TableCell align="center">
             
                <IconButton color="error" onClick={() => handleDeleteClick(item)}>
                  <Iconify icon="mdi:trash-can-outline" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {announcements.length === 0 && (
        <Typography textAlign="center" py={3}>
          No announcements found
        </Typography>
      )}


      <DeleteAnnouncementModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      <AddAnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddAnnouncement}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}