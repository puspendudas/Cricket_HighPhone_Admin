import type { SxProps } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { Box, Grid, Card, Avatar, Typography, CardContent } from '@mui/material';

import useMeApi from 'src/Api/me/useMeApi';
import useDashboardApi from 'src/Api/dashbordApi/useDashbordApi';

import { Iconify } from 'src/components/iconify';

// UserRole type definition
export type UserRole = 'super_admin' | 'admin' | 'super_master' | 'master' | 'super_agent' | 'agent';

const DashboardContent: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [userType, setUserType] = useState<UserRole | ''>('');
  const { fetchDashboardData } = useDashboardApi();
  const { fetchMe } = useMeApi();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch user data and dashboard data simultaneously
        const [userResponse, dashboardResponse] = await Promise.all([
          fetchMe(),
          fetchDashboardData()
        ]);

        setUserType(userResponse.data.type);
        setData(dashboardResponse);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data || !userType) return <div>Loading...</div>;

  // Define hierarchy order (only for roles, exclude 'user')
  const hierarchy: UserRole[] = ['super_admin', 'admin', 'super_master', 'master', 'super_agent', 'agent'];

  const cards = [
    { title: 'Admin', key: 'admin', icon: 'mdi:account', color: '#4CAF50', path: '/master/admin' },
    { title: 'Super Master', key: 'super_master', icon: 'mdi:account', color: '#FF8A65', path: '/master/super-master' },
    { title: 'Master', key: 'master', icon: 'mdi:account', color: '#BA68C8', path: '/master/masters' },
    { title: 'Super Agent', key: 'super_agent', icon: 'mdi:account', color: '#42A5F5', path: '/master/super-agent' },
    { title: 'Agent', key: 'agent', icon: 'mdi:account', color: '#A1887F', path: '/master/agent' },
    { title: 'Client', key: 'user', icon: 'mdi:account', color: '#FF9800', path: '/master/client' },
  ];

  const filteredCards = cards.filter(card => {
    if (card.key === 'user') return true;

    const userIndex = hierarchy.indexOf(userType as UserRole);
    const cardIndex = hierarchy.indexOf(card.key as UserRole);

    return cardIndex > userIndex;
  });

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      {filteredCards.map((card, index) => {
        const count = data[card.key]?.count ?? 0;
        const wallet = data[card.key]?.wallet ?? 0;

        return (
          <Grid item xs={6} sm={6} md={4} key={index}>
            <Card
              sx={{
                p: { xs: 1.5, sm: 2 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: 2,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.25s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0px 8px 24px rgba(0, 167, 111, 0.15)',
                  borderColor: 'primary.main',
                },
              }}
              onClick={() => navigate(card.path)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: card.color,
                    width: { xs: 34, sm: 40 },
                    height: { xs: 34, sm: 40 },
                    boxShadow: `0 4px 10px ${card.color}40`,
                  }}
                >
                  <Iconify icon={card.icon} width={20} style={{ color: '#fff' }} />
                </Avatar>
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {count}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontSize: { xs: '0.68rem', sm: '0.75rem' },
                    display: 'block',
                  }}
                  noWrap
                >
                  {card.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.25 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.95rem', sm: '1.2rem' },
                      color: 'text.primary',
                    }}
                    noWrap
                  >
                    ₹{wallet.toLocaleString()}
                  </Typography>
                  <Iconify
                    icon="mdi:arrow-top-right"
                    width={16}
                    sx={{ color: 'text.disabled', display: { xs: 'none', sm: 'block' } }}
                  />
                </Box>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default DashboardContent;
