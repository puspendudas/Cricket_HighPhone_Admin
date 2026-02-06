// EditAnnouncementModal.tsx
import React, { useState, useEffect } from 'react';

import {
  Dialog,
  Button,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
} from '@mui/material';

interface EditAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  announcement: {
    id: string;
    recipient: string;
    match: string;
    message: string;
    status: string;
  } | null;
  onSubmit: (data: {
    id: string;
    user_type: string;  // Changed from 'team' to match API
    match_id: string;   // Changed from 'match' to match API
    body: string;       // Changed from 'message' to match API
    status?: boolean;   // Added status field
  }) => void;
}

export default function EditAnnouncementModal({
  open,
  onClose,
  announcement,
  onSubmit,
}: EditAnnouncementModalProps) {
  const [user_type, setUserType] = useState('');
  const [match_id, setMatchId] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<boolean>(true);

  useEffect(() => {
    if (announcement) {
      setUserType(announcement.recipient);
      setMatchId(announcement.match);
      setBody(announcement.message);
      setStatus(announcement.status === 'Active');
    }
  }, [announcement]);

  const handleSubmit = () => {
    if (announcement && body && match_id) {
      onSubmit({
        id: announcement.id,
        user_type,
        match_id,
        body,
        status
      });
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Announcement</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="normal">
          <InputLabel>Select Recipient</InputLabel>
          <Select
            value={user_type}
            label="Select Recipient"
            onChange={(e) => setUserType(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Team A">Team A</MenuItem>
            <MenuItem value="Team B">Team B</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Choose Match</InputLabel>
          <Select
            value={match_id}
            label="Choose Match"
            onChange={(e) => setMatchId(e.target.value)}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Lahore Qalandars v Peshawar Zalmi">
              Lahore Qalandars v Peshawar Zalmi
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Message"
          margin="normal"
          multiline
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={!body}
          helperText={!body ? 'Message is required' : ''}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value === 'true')}
          >
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!body || !match_id}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}