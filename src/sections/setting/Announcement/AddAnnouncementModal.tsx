// AddAnnouncementModal.tsx
import type { CreateAnnouncementData } from 'src/Interface/announcement';

import React, { useState, useEffect } from 'react';

import {
  Box,
  Dialog,
  Button,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import useMatchApi from 'src/Api/matchApi/useMatchApi';

interface AddAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAnnouncementData) => void;
}

interface Match {
  _id: string;
  gameId: string;
  eventName: string;
}

export default function AddAnnouncementModal({
  open,
  onClose,
  onSubmit,
}: AddAnnouncementModalProps) {
  const [userType, setUserType] = useState('all');
  const [matchId, setMatchId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  const { fetchAllMatch } = useMatchApi();

  // Fetch matches when modal opens
  useEffect(() => {
    if (open) {
      loadMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const res = await fetchAllMatch();
      if (res?.matches) {
        setMatches(res.matches);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) {
      return;
    }
    // Create proper payload
    const announcementData: CreateAnnouncementData = {
      title: title.trim(),
      body: body.trim(),
      status: status ? 'true' : 'false',
      user_type: userType,
      match_id: matchId || null,
    };

    console.log('Submitting payload:', announcementData);

    onSubmit(announcementData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setUserType('all');
    setMatchId('');
    setTitle('');
    setBody('');
    setStatus(true);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Announcement</DialogTitle>
      <DialogContent>
        {/* Title Field */}
        <TextField
          fullWidth
          label="Title"
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!title.trim()}
          helperText={!title.trim() ? 'Title is required' : ''}
        />

        {/* User Type Selection */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Select User Type</InputLabel>
          <Select
            value={userType}
            label="Select User Type"
            onChange={(e) => setUserType(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>

        {/* Match Selection */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Choose Match</InputLabel>
          <Select
            value={matchId}
            label="Choose Match"
            onChange={(e) => setMatchId(e.target.value)}
            disabled={loading}
          >
            <MenuItem value="">No Match (General Announcement)</MenuItem>
            {matches.map((match) => (
              <MenuItem key={match._id} value={match._id}>
                {match.eventName} (ID: {match.gameId})
              </MenuItem>
            ))}
          </Select>
          {loading && <CircularProgress size={20} sx={{ position: 'absolute', right: 40, top: '50%' }} />}
        </FormControl>


        {/* Body Field */}
        <TextField
          fullWidth
          label="Message Body"
          margin="normal"
          multiline
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={!body.trim()}
          helperText={!body.trim() ? 'Message body is required' : ''}
        />

        {/* Status Toggle */}
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                color="primary"
              />
            }
            label="Active Status"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
            {status ? 'Announcement will be visible to users' : 'Announcement will be hidden'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!title.trim() || !body.trim()}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}