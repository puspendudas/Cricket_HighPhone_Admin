import React from 'react';

import {
  Dialog,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

interface DeleteAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAnnouncementModal({
  open,
  onClose,
  onConfirm,
}: DeleteAnnouncementModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete Announcement</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this announcement?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
