// StatusModal.tsx
import type { Dayjs } from 'dayjs';

import React from 'react';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
    Grid,
    Dialog,
    Button,
    TextField,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';

interface StatusModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    date: Dayjs;
    time: Dayjs;
}

export default function StatusModal({
    open,
    onClose,
    onConfirm,
    date,
    time
}: StatusModalProps) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
                <DialogTitle>Match Date & Time</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        <Grid item xs={12}>
                            <DatePicker
                                label="Date"
                                value={date}
                                readOnly
                                slots={{ textField: TextField }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        disabled: true,
                                    },
                                }}
                            />

                        </Grid>
                        <Grid item xs={12}>
                            <TimePicker
                                label="Time"
                                value={time}
                                readOnly
                                slots={{ textField: TextField }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        disabled: true,
                                    },
                                }}
                            />

                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button color='primary' variant="contained" onClick={onConfirm}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}
