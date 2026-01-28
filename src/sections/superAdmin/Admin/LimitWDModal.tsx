import React, { useState } from 'react';

import {
    Box,
    Stack,
    Dialog,
    Button,
    TextField,
    Typography,
    IconButton,
    DialogContent,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

interface LimitWDModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (amount: number, type: 'withdrawal' | 'deposit') => void;
    currentWithdrawal: number;
    currentDeposit: number;
}

const LimitWDModal = ({
    open,
    onClose,
    onSubmit,
    currentWithdrawal,
    currentDeposit,
}: LimitWDModalProps) => {
    const [amount, setAmount] = useState<string>('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {value} = e.target;
        if (/^\d*$/.test(value)) {
            setAmount(value);
        }
    };

    const handleTransaction = (type: 'withdrawal' | 'deposit') => {
        if (amount) {
            onSubmit(Number(amount), type);
            onClose();
            setAmount('');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            sx={{ '& .MuiPaper-root': { width: 600 } }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" p={5}>
                <Typography variant="h6" fontWeight="bold">
                    Withdrawal / Deposit
                </Typography>
                <IconButton onClick={onClose}>
                    <Iconify icon="eva:close-fill" width={24} height={24} />
                </IconButton>
            </Box>

            <DialogContent>
                <Typography fontWeight={500} mb={1}>
                    Amount &nbsp;
                    <span style={{ color: 'red' }}>( W : {currentWithdrawal} )</span>
                    &nbsp;
                    <span style={{ color: 'green' }}>( D : {currentDeposit} )</span>
                </Typography>

                <TextField
                    placeholder="Enter Amount"
                    fullWidth
                    value={amount}
                    onChange={handleAmountChange}
                    type="number"
                    variant="outlined"
                    InputProps={{
                        style: {
                            borderRadius: 12,
                        },
                    }}
                    sx={{ mt: 1.5, mb: 3 }}
                />

                <Stack direction="row" spacing={2} justifyContent="center" m={4}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleTransaction('withdrawal')}
                        sx={{
                            backgroundColor: 'red',
                            '&:hover': { backgroundColor: '#c40000' },
                            borderRadius: '30px',
                            textTransform: 'none',
                        }}
                    >
                        Withdrawal
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleTransaction('deposit')}
                        sx={{
                            backgroundColor: 'green',
                            '&:hover': { backgroundColor: '#007b00' },
                            borderRadius: '30px',
                            textTransform: 'none',
                        }}
                    >
                        Deposit
                    </Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default LimitWDModal;
