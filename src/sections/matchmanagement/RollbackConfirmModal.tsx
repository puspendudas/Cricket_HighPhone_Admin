import React from 'react';

import {
    Dialog,
    Button,
    Typography,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';

interface RollbackConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function RollbackConfirmModal({ open, onClose, onConfirm }: RollbackConfirmModalProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: "bold" }}>Confirm Rollback</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to <strong>Rollback</strong>?
                </Typography>
            </DialogContent>
            <DialogActions sx={{ display: "flex", justifyContent: "flex-end", gap: 2, p: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{ bgcolor: "#F32D2D33", color: "#F32D2D", px: 3 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    sx={{ bgcolor: "#0ED98D33", color: "#1E9C6D", px: 3 }}
                >
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default RollbackConfirmModal;