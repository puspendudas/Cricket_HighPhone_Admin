import React from 'react';

import {
    Box,
    Grid,
    Paper,
    Table,
    Button,
    Select,
    MenuItem,
    TableRow,
    TableBody,
    TableCell,
    TableHead,
    TextField,
    Typography,
    TableContainer
} from '@mui/material';



export default function AllMembersTable() {
    return (
        <Box sx={{ p: 3 }}>
            {/* Dropdown Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body1" mb={1}>
                    Select Sport
                </Typography>
                <Select
                    sx={{ width: '50%' }}
                    defaultValue="Chennai Super Kings v Sunrisers Hyderabad (Jan 01 05:30:00 AM)"
                >
                    <MenuItem value="Chennai Super Kings v Sunrisers Hyderabad (Jan 01 05:30:00 AM)">
                        Chennai Super Kings v Sunrisers Hyderabad (Jan 01 05:30:00 AM)
                    </MenuItem>
                </Select>
            </Paper>


            {/* Search & Create Section */}
            <Paper sx={{ p: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
                <Grid container justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">All Members</Typography>

                    <Box display="flex" gap={2}>
                        <TextField size="small" placeholder="Search" />
                        <Button variant="contained" color='primary'>Create Member</Button>
                    </Box>
                </Grid>

                {/* Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            {/* Head Titles Row */}
                            <TableRow>
                                {/* CLIENT P/L */}
                                <TableCell
                                    colSpan={6}
                                    align="center"
                                    sx={{
                                        backgroundColor: '#4e80ff',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRight: '3px solid #f5f5f5' // Gap border
                                    }}
                                >
                                    CLIENT P/L
                                </TableCell>

                                {/* Other sections */}
                                {[
                                    'AGENT P/L',
                                    'SUPER AGENT P/L',
                                    'MASTER P/L',
                                    'Super Master P/L',
                                    'SUPER ADMIN P/L',
                                    'ADMIN P/L',
                                ].map((title, index) => (
                                    <TableCell
                                        key={title}
                                        colSpan={6}
                                        align="center"
                                        sx={{
                                            backgroundColor: '#4e80ff',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            borderRight: index < 5 ? '3px solid #f5f5f5' : 'none' // Gap except last
                                        }}
                                    >
                                        {title}
                                    </TableCell>
                                ))}
                            </TableRow>

                            {/* Sub-header Row */}
                            <TableRow>
                                {/* CLIENT P/L columns */}
                                {['M.AMT', 'S.AMT', 'TOT.AMT', 'NET.AMT', 'SHR.AMT', 'FINAL'].map((label) => (
                                    <TableCell
                                        key={`client-${label}`}
                                        sx={{ borderRight: label === 'FINAL' ? '3px solid #f5f5f5' : 'none' }}
                                    >
                                        {label}
                                    </TableCell>
                                ))}

                                {/* Other sections columns */}
                                {[...Array(6)].flatMap((_, sectionIndex) =>
                                    ['M.COM', 'S.COM', 'TOT.COM', 'NET.AMT', 'SHR.AMT', 'FINAL'].map((label) => (
                                        <TableCell
                                            key={`section-${sectionIndex}-${label}`}
                                            sx={{
                                                borderRight: label === 'FINAL' && sectionIndex < 5 ? '3px solid #f5f5f5' : 'none'
                                            }}
                                        >
                                            {label}
                                        </TableCell>
                                    ))
                                )}
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {/* Data Row */}
                            <TableRow>
                                {/* CLIENT P/L data */}
                                <TableCell>₹100</TableCell>
                                <TableCell sx={{ color: 'red' }}>-₹200</TableCell>
                                <TableCell sx={{ color: 'red' }}>-₹100</TableCell>
                                <TableCell sx={{ color: 'green' }}>₹500</TableCell>
                                <TableCell>₹50</TableCell>
                                <TableCell sx={{ color: 'green', borderRight: '3px solid #f5f5f5' }}>₹550</TableCell>

                                {/* Other sections data */}
                                {[...Array(6)].flatMap((_, sectionIndex) => [
                                    <TableCell key={`data-${sectionIndex}-mcom`}>₹0</TableCell>,
                                    <TableCell key={`data-${sectionIndex}-scom`} sx={{ color: 'red' }}>-₹6120</TableCell>,
                                    <TableCell key={`data-${sectionIndex}-totcom`} sx={{ color: 'red' }}>-₹6120</TableCell>,
                                    <TableCell key={`data-${sectionIndex}-netamt`} sx={{ color: 'green' }}>₹39900</TableCell>,
                                    <TableCell key={`data-${sectionIndex}-shramt`}>₹0</TableCell>,
                                    <TableCell
                                        key={`data-${sectionIndex}-final`}
                                        sx={{
                                            color: 'green',
                                            borderRight: sectionIndex < 5 ? '3px solid #f5f5f5' : 'none'
                                        }}
                                    >
                                        ₹39900
                                    </TableCell>,
                                ])}
                            </TableRow>

                            {/* Total Row */}
                            <TableRow sx={{ backgroundColor: '#ffcc00' }}>
                                {/* CLIENT P/L total */}
                                <TableCell sx={{ color: 'red' }}>-₹1000</TableCell>
                                <TableCell sx={{ color: 'red' }}> -500</TableCell>
                                <TableCell sx={{ color: 'red' }}>-₹3000</TableCell>
                                <TableCell sx={{ color: 'green' }}>₹10000</TableCell>
                                <TableCell>₹500</TableCell>
                                <TableCell sx={{ color: 'green', borderRight: '3px solid #f5f5f5' }}>₹10500</TableCell>

                                {/* Other sections totals */}
                                {[...Array(6)].flatMap((_, sectionIndex) => [
                                    <TableCell key={`total-${sectionIndex}-mcom`} sx={{ color: 'red' }}>-₹1000</TableCell>,
                                    <TableCell key={`total-${sectionIndex}-scom`} sx={{ color: 'red' }}>-500</TableCell>,
                                    <TableCell key={`total-${sectionIndex}-totcom`} sx={{ color: 'red' }}>-₹3000</TableCell>,
                                    <TableCell key={`total-${sectionIndex}-netamt`} sx={{ color: 'green' }}>₹10000</TableCell>,
                                    <TableCell key={`total-${sectionIndex}-shramt`}>₹500</TableCell>,
                                    <TableCell
                                        key={`total-${sectionIndex}-final`}
                                        sx={{
                                            color: 'green',
                                            borderRight: sectionIndex < 5 ? '3px solid #f5f5f5' : 'none'
                                        }}
                                    >
                                        ₹10500
                                    </TableCell>,
                                ])}
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}