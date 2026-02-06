import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Grid,
  Menu,
  Paper,
  Table,
  Button,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

interface Match {
  id: number;
  date: string;
  name: string;
  avatarUrl: string;
  winner: string | 'Cancelled' | 'DOLP';
  myShare: string;
  totalPL: string;
}

const matches: Match[] = [
  {
    id: 1,
    date: 'Apr 25, 19:30:00 PM',
    name: 'Chennai Super Kings v Sunrisers Hyderabad',
    avatarUrl: '/assets/team-csk-vs-srh.png',
    winner: 'CSK',
    myShare: '₹502',
    totalPL: '₹5022',
  },
  {
    id: 2,
    date: 'Apr 24, 20:30:00 PM',
    name: 'Chennai Super Kings v Sunrisers Hyderabad',
    avatarUrl: '/assets/team-csk-vs-srh.png',
    winner: 'Cancelled',
    myShare: '₹502',
    totalPL: '₹5022',
  },
  {
    id: 3,
    date: 'Apr 24, 20:30:00 PM',
    name: 'Chennai Super Kings v Sunrisers Hyderabad',
    avatarUrl: '/assets/team-csk-vs-srh.png',
    winner: 'CSK',
    myShare: '₹502',
    totalPL: '₹5022',
  },
  {
    id: 4,
    date: 'Apr 24, 20:30:00 PM',
    name: 'Delhi Capitals v Lucknow Super Giants',
    avatarUrl: '/assets/team-dc-vs-lsg.png',
    winner: 'DOLP',
    myShare: '₹502',
    totalPL: '₹5022',
  },
];

export function CasinoTableData() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [, setSelectedRowId] = React.useState<number | null>(null);
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLElement>, rowId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rowId);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };
  const handleNavigation = (path: string) => {
    handleClose();
    navigate(path);
  };
  return (
    <Paper sx={{ p: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
        <Grid item>
          <Typography variant="h5" >
            Casino Betting
          </Typography>
        </Grid>
        <Grid item>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: '#f5f5f5',
            p: 2,
            borderRadius: 1
          }}>
            <Typography sx={{ fontSize: '14px' }} fontWeight="bold">
              TOTAL
            </Typography>
            <Typography sx={{ fontSize: '14px' }} fontWeight="bold" color="error">
              -64,317
            </Typography>
            <Typography sx={{ fontSize: '14px' }} fontWeight="bold" color="#00BB0B">
              -2,886,977
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Table>
        <TableHead sx={{ backgroundColor: '#f4f6f8' }}>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Match</TableCell>
            <TableCell>Winner</TableCell>
            <TableCell>My Share P/L</TableCell>
            <TableCell>Total P/L</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>{match.id}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {match.date}
                </Typography>
              </TableCell>
              <TableCell>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item>
                    <img
                      src={match.avatarUrl}
                      alt="match"
                      width={32}
                      height={32}
                      style={{ borderRadius: '4px' }}
                    />
                  </Grid>
                  <Grid item>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {match.name}
                    </Typography>
                  </Grid>
                </Grid>
              </TableCell>
              <TableCell>
                {match.winner === 'Cancelled' ? (
                  <Button variant="contained" color="warning" size="small">
                    X Cancelled
                  </Button>
                ) : match.winner === 'DOLP' ? (
                  <Button variant="contained" color="primary" size="small">
                    DOLP
                  </Button>
                ) : (
                  <img
                    src="/assets/winner-icon.png"
                    alt="winner"
                    width={24}
                    height={24}
                  />
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {match.myShare}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {match.totalPL}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <IconButton onClick={(e) => handleClick(e, match.id)}>
                  <Iconify icon="material-symbols:more-vert" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleNavigation('/sport/match-session')}>
          <Iconify icon="material-symbols:sports-baseball-outline" sx={{ mr: 1 }} />
          Match & Session Plus Minus
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/sport/display-match')}>
          <Iconify icon="material-symbols:visibility-outline" sx={{ mr: 1 }} />
          Display Match Bet
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/sport/display-match-session')}>
          <Iconify icon="material-symbols:visibility-outline" sx={{ mr: 1 }} />
          Display Session Bet
        </MenuItem>
        <MenuItem onClick={() => handleNavigation('/sport/undeclared-match')}>
          <Iconify icon="material-symbols:visibility-outline" sx={{ mr: 1 }} />
          Un Declared Bet
        </MenuItem>
      </Menu>
    </Paper>
  );
};