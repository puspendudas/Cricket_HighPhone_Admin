import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
    Grid,
    Chip,
    Dialog,
    Button,
    useTheme,
    TextField,
    Typography,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery
} from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useMatchApi from 'src/Api/matchApi/useMatchApi';

interface SettlementModalProps {
    open: boolean;
    onClose: () => void;
    client: any;
    adminIdFrom?: string;
}

const SettlementModal: React.FC<SettlementModalProps> = ({
    open,
    onClose,
    client,
    adminIdFrom: navigatedAdminId
}) => {
    const [amountType, setAmountType] = useState<'credit' | 'debit'>('credit');
    const [settledType, setSettledType] = useState<'credit' | 'debit'>('credit');
    const [settledAmount, setSettledAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);

    const { AddSettlement } = useMatchApi();
    const { fetchMe } = useMeApi();
    const queryClient = useQueryClient();

    // NEW: mobile detect (Logic ko touch nahi kiya)
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { data: userData } = useQuery({
        queryKey: ['userData'],
        queryFn: fetchMe,
    });

    // 🔑 priority: navigated admin > logged-in user
    const adminIdFrom =
        navigatedAdminId || userData?.data?._id;




    const currentUserId = userData?.data?._id;

    useEffect(() => {
        if (client?.type === 'PAYMENT_RECEIVING_FROM') {
            setAmountType('credit');
            setSettledType('credit');
        }
        else if (client?.type === 'PAYMENT_PAID_TO') {
            setAmountType('debit');
            setSettledType('debit');
        }
    }, [client]);


    const toggleSettledType = () => {
        setSettledType(prev => prev === 'credit' ? 'debit' : 'credit');
    };

    const getChipColor = (type: 'credit' | 'debit') =>
        type === 'credit' ? 'success' : 'error';

    const getChipLabel = (type: 'credit' | 'debit') =>
        type === 'credit' ? 'Credit (लेना)' : 'Debit (देना)';

    const handleSettledAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettledAmount(e.target.value);
    };

    const handleRemarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRemark(e.target.value);
    };

    const handleSave = async () => {
        if (!settledAmount || !client) return;

        setLoading(true);

        try {
            const immediateChildAdminId = client.immediate_child_admin?._id;
            if (!immediateChildAdminId || !currentUserId) return;

            const payload = {
                adminIdTo: immediateChildAdminId,
                adminIdFrom,
                ammount: parseFloat(settledAmount),
                type: settledType,
                remark: remark || 'Settlement'
            };


            const response = await AddSettlement(payload);
            console.log(response)
            queryClient.invalidateQueries({ queryKey: ['settlementData'] });
            queryClient.invalidateQueries({ queryKey: ['childSettlementData'] });

            setSettledAmount('');
            setRemark('');
            setSettledType('credit');
            onClose();

        } catch (error) {
            console.error('Error adding settlement:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle fontWeight="bold">Settlement</DialogTitle>

            <DialogContent>
                <Grid container spacing={2} mt={1}>

                    {/* Client */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2">Client</Typography>
                        <TextField value={client?.client || ''} fullWidth disabled />
                    </Grid>

                    {/* Amount */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2">Amount</Typography>

                        <TextField
                            value={
                                client && client.final !== undefined
                                    ? Math.abs(client.final).toFixed(1)
                                    : ''
                            }
                            fullWidth
                            disabled
                            InputProps={
                                !isMobile
                                    ? {
                                        endAdornment: (
                                            <Chip
                                                label={getChipLabel(amountType)}
                                                size="small"
                                                color={getChipColor(amountType)}
                                            />
                                        )
                                    }
                                    : {}
                            }
                        />

                        {isMobile && (
                            <Chip
                                label={getChipLabel(amountType)}
                                size="small"
                                color={getChipColor(amountType)}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Grid>

                    {/* Settled Amount */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2">Settled Amount</Typography>

                        <TextField
                            placeholder="Enter amount"
                            fullWidth
                            value={settledAmount}
                            onChange={handleSettledAmountChange}
                            type="number"
                            InputProps={
                                !isMobile
                                    ? {
                                        endAdornment: (
                                            <Chip
                                                label={getChipLabel(settledType)}
                                                size="small"
                                                color={getChipColor(settledType)}
                                                clickable
                                                onClick={toggleSettledType}
                                            />
                                        )
                                    }
                                    : {}
                            }
                        />

                        {isMobile && (
                            <Chip
                                label={getChipLabel(settledType)}
                                size="small"
                                color={getChipColor(settledType)}
                                clickable
                                onClick={toggleSettledType}
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Grid>

                    {/* Remark */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2">Remark</Typography>
                        <TextField
                            placeholder="Enter remark"
                            fullWidth
                            value={remark}
                            onChange={handleRemarkChange}
                        />
                    </Grid>

                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    variant="contained"
                    onClick={onClose}
                    disabled={loading}
                    sx={{ backgroundColor: '#F32D2D33', color: '#F32D2D', fontWeight: 'bold' }}
                >
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading || !settledAmount}
                    sx={{ backgroundColor: '#0ED98D33', color: '#1EC6D8', fontWeight: 'bold' }}
                >
                    {loading ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SettlementModal;
