import React from 'react';

import {
  Box,
  Dialog,
  Button,
  Avatar,
  Typography,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

interface DeactivateModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isActive: boolean;
}


export function DeactivateModal({ open, onClose, onConfirm, userName, isActive }: DeactivateModalProps) {
  const actionText = isActive ? "Deactivate" : "Activate";
  const actionColor = isActive ? "#e53935" : "#1e9c6d";   
  const hoverColor = isActive ? "#c62828" : "#148c55";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box p={3} textAlign="center">
        <Typography variant="h6" fontWeight="bold">
          {actionText} ( {userName} )
        </Typography>

        <Box mt={3} mb={2} display="flex" justifyContent="center">
          <Box position="relative">
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: isActive ? '#fdecec' : '#e8f5e9',
              }}
            >
              <Iconify
                icon="ic:round-person"
                width={40}
                color={isActive ? "#e53935" : "#1e9c6d"}
              />
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                backgroundColor: '#fff',
                borderRadius: '50%',
                padding: '2px',
              }}
            >
              <Iconify
                icon={isActive ? "ic:round-block" : "ic:round-check-circle"}
                width={20}
                color={actionColor}
              />
            </Box>
          </Box>
        </Box>

        <Typography variant="body1" color="textSecondary">
          Are you sure you want to {actionText} this User ({userName})?
        </Typography>

        <Box mt={4} display="flex" justifyContent="space-between" gap={2}>
          <Button
            onClick={onClose}
            fullWidth
            variant="outlined"
            sx={{
              borderRadius: '25px',
              textTransform: 'none',
              height: 45,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: actionColor,
              color: '#fff',
              borderRadius: '25px',
              textTransform: 'none',
              height: 45,
              '&:hover': {
                backgroundColor: hoverColor,
              },
            }}
          >
            {actionText}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
