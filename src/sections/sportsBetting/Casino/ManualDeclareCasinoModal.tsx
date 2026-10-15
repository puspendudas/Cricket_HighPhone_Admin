import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Dialog,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';

import useCasinoApi from 'src/Api/CasinoApi/CasinoApi';
import { CASINO_GAMES, getCasinoSelections } from 'src/utils/casino';

interface ManualDeclareCasinoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialGameCode?: string;
  initialRoundId?: string;
}

export function ManualDeclareCasinoModal({
  open,
  onClose,
  onSuccess,
  initialGameCode,
  initialRoundId,
}: ManualDeclareCasinoModalProps) {
  const { declareCasinoResult } = useCasinoApi();

  const [gameCode, setGameCode] = useState<string>(initialGameCode || 'teen20');
  const [roundId, setRoundId] = useState<string>(initialRoundId || '');
  const [winningSelection, setWinningSelection] = useState<string>('');
  const [rdesc, setRdesc] = useState<string>('');
  const [card, setCard] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (open) {
      setGameCode(initialGameCode || 'teen20');
      setRoundId(initialRoundId || '');
      setWinningSelection('');
      setRdesc('');
      setCard('');
      setErrorMsg('');
    }
  }, [open, initialGameCode, initialRoundId]);

  const availableSelections = useMemo(() => {
    const list = getCasinoSelections(gameCode);
    return Array.from(new Set([...list, 'VOID']));
  }, [gameCode]);

  const handleSubmit = async () => {
    if (!gameCode) {
      setErrorMsg('Please select a casino game');
      return;
    }
    if (!roundId.trim()) {
      setErrorMsg('Please enter a valid Round ID');
      return;
    }
    if (!winningSelection.trim()) {
      setErrorMsg('Please select or specify a winning selection');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const result = await declareCasinoResult(
        gameCode,
        roundId.trim(),
        winningSelection.trim(),
        rdesc.trim() || undefined,
        card.trim() || undefined
      );

      if (result) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (err: any) {
      console.error('Manual declare error:', err);
      setErrorMsg(err?.message || 'Failed to manually declare result');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="div">
          Manual Casino Result Declaration
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Manually settle stuck or undeclared casino rounds across all players
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="warning">
            Manually declaring a round will settle all pending bets for this round and credit/debit client wallets immediately. This action cannot be reversed.
          </Alert>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <FormControl fullWidth size="small">
            <InputLabel id="casino-game-select-label">Casino Game</InputLabel>
            <Select
              labelId="casino-game-select-label"
              label="Casino Game"
              value={gameCode}
              onChange={(e) => {
                setGameCode(e.target.value);
                setWinningSelection('');
              }}
              disabled={isSubmitting}
            >
              {Object.entries(CASINO_GAMES).map(([code, title]) => (
                <MenuItem key={code} value={code}>
                  {title} ({code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Round ID"
            fullWidth
            size="small"
            value={roundId}
            onChange={(e) => setRoundId(e.target.value)}
            placeholder="e.g. 1234567890"
            disabled={isSubmitting}
            helperText="Enter the exact Round ID of the stuck round"
            required
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Quick Selection:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              {availableSelections.map((sel) => (
                <Chip
                  key={sel}
                  label={sel}
                  color={winningSelection === sel ? 'primary' : 'default'}
                  variant={winningSelection === sel ? 'filled' : 'outlined'}
                  onClick={() => setWinningSelection(sel)}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                  disabled={isSubmitting}
                />
              ))}
            </Stack>

            <TextField
              label="Winning Selection / Outcome"
              fullWidth
              size="small"
              value={winningSelection}
              onChange={(e) => setWinningSelection(e.target.value)}
              placeholder="e.g. Player A, Dragon, Low, VOID"
              disabled={isSubmitting}
              helperText="Click a quick selection chip above or enter manually"
              required
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Result Description (Optional)"
                fullWidth
                size="small"
                value={rdesc}
                onChange={(e) => setRdesc(e.target.value)}
                placeholder="e.g. Player A Won"
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cards Detail (Optional)"
                fullWidth
                size="small"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                placeholder="e.g. 1,2,3"
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={isSubmitting || !roundId.trim() || !winningSelection.trim()}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {isSubmitting ? 'Declaring...' : 'Declare Result'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export default ManualDeclareCasinoModal;
