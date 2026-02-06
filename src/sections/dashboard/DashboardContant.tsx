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
    <Grid container spacing={1}>
      {filteredCards.map((card, index) => {
        const count = data[card.key]?.count ?? 0;
        const wallet = data[card.key]?.wallet ?? 0;

        return (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: '0.3s',
                '&:hover': { transform: 'scale(1.03)' }
              }}
              onClick={() => navigate(card.path)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 } as SxProps<Theme>}>
                  <Avatar sx={{ bgcolor: card.color, width: 40, height: 40 }}>
                    <Iconify icon={card.icon} style={{ color: '#fff' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      {card.title} ({count})
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {wallet.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box flexGrow={1} />
                  <Iconify icon="mdi:trending-up" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>

  );
};

export default DashboardContent;
