import { useState, useEffect } from 'react';

import {
    Table,
    Paper,
    Dialog,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    IconButton,
    DialogTitle,
    DialogContent,
    TableContainer,
    TablePagination,
} from '@mui/material';

import useActionApi from 'src/Api/actionApi/useActionApi';

import { Iconify } from 'src/components/iconify';

interface LimitUpdate {
    id: number;
    amount: string;
    type: 'DEBIT' | 'CREDIT';
    dateTime: string;
    remark: string;
}

interface LimitUpdatesModalProps {
    open: boolean;
    onClose: () => void;
    userName: string;
    userId: string;
}

export function LimitUpdatesModal({ open, onClose, userName, userId }: LimitUpdatesModalProps) {
    const { FatchClintLimitData } = useActionApi();
    const [limitUpdates, setLimitUpdates] = useState<LimitUpdate[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    useEffect(() => {
        if (!open) return;
        const fetchData = async () => {
            try {
                const response = await FatchClintLimitData(userId, 'User');
                const formatted = response.data.map((item: any, index: number) => ({
                    id: index + 1,
                    amount: `₹${item.amount}`,
                    type: item.type.toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT',
                    dateTime: new Date(item.createdAt).toLocaleString(),
                    remark: item.note || '',
                }));

                setLimitUpdates(formatted);
            } catch (err) {
                console.error('Error fetching limit updates:', err);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, userId]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Limit Updates Details ({userName})
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <Iconify icon="material-symbols:close" />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Debit/Credit</TableCell>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Remark</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {limitUpdates.map((update) => (
                                <TableRow key={update.id}>
                                    <TableCell>{update.id}</TableCell>
                                    <TableCell>{update.amount}</TableCell>
                                    <TableCell sx={{
                                        color: update.type === 'CREDIT' ? 'success.main' : 'error.main',
                                        fontWeight: 'bold'
                                    }}>
                                        {update.type}
                                    </TableCell>
                                    <TableCell>{update.dateTime}</TableCell>
                                    <TableCell>{update.remark}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={limitUpdates.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </DialogContent>
        </Dialog>
    );
}