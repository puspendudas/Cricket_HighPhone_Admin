import React from 'react';

import {
  Box,
  Dialog,
  Divider,
  Typography,
  IconButton,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

interface CasinoRulesModalProps {
  open: boolean;
  onClose: () => void;
  gtype: string;
}

const RULES_MAP: Record<string, { title: string; image: string }> = {
  teen: {
    title: 'Teenpatti 1-day Rules',
    image: '/assets/rules/teen.jpeg',
  },
  teen20: {
    title: '20-20 Teenpatti Rules',
    image: '/assets/rules/teen20.jpeg',
  },
  dt20: {
    title: 'Dragon Tiger 20-20 Rules',
    image: '/assets/rules/dt20.jpeg',
  },
  lucky7eu: {
    title: 'Lucky 7 Rules & Payouts',
    image: '/assets/rules/lucky7.jpeg',
  },
};

export default function CasinoRulesModal({ open, onClose, gtype }: CasinoRulesModalProps) {
  const ruleInfo = RULES_MAP[gtype] || {
    title: 'Casino Game Rules',
    image: '/assets/rules/teen20.jpeg',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 10px 35px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          maxWidth: '520px',
          p: { xs: 1.5, sm: 2.5 },
        },
      }}
    >
      {/* Header */}
      <Box alignItems="center" display="flex" justifyContent="space-between" mb={1}>
        <Typography color="#1E293B" fontWeight={700} sx={{ fontSize: { xs: '16px', sm: '18px' } }} variant="h6">
          {ruleInfo.title}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ '&:hover': { bgcolor: '#F1F5F9' }, color: '#64748B' }}>
          <Iconify icon="eva:close-fill" width={20} />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Rules Image Container */}
      <Box
        sx={{
          alignItems: 'flex-start',
          bgcolor: '#F8FAFC',
          borderRadius: '8px',
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          overflowY: 'auto',
          p: 1,
        }}
      >
        <Box
          component="img"
          src={ruleInfo.image}
          alt={ruleInfo.title}
          sx={{
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            height: 'auto',
            maxHeight: '75vh',
            objectFit: 'contain',
            width: '100%',
          }}
        />
      </Box>
    </Dialog>
  );
}
