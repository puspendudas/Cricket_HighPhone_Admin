import React, { useState, useEffect } from 'react';

import {
  Box,
  Dialog,
  Divider,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';
import axiosInstance, { endpoints } from 'src/utils/axios';


interface CardImageProps {
  cardStr: string;
  size?: 'normal' | 'small';
}

export const CardImage = ({ cardStr, size = 'normal' }: CardImageProps) => {
  const [imgSrc, setImgSrc] = useState(
    cardStr
      ? `https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/${cardStr}.jpg`
      : 'https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/1.jpg'
  );

  useEffect(() => {
    if (cardStr) {
      setImgSrc(`https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/${cardStr}.jpg`);
    } else {
      setImgSrc('https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/1.jpg');
    }
  }, [cardStr]);

  const isSmall = size === 'small';

  return (
    <Box
      component="img"
      src={imgSrc}
      alt={cardStr || 'card'}
      onError={() => {
        setImgSrc('https://g1ver.sprintstaticdata.com/v105/static/front/img/cards/1.jpg');
      }}
      sx={{
        borderRadius: '4px',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        flexShrink: 0,
        height: isSmall ? { xs: 48, sm: 58 } : { xs: 58, sm: 72 },
        mx: { xs: 0.3, sm: 0.5 },
        objectFit: 'cover',
        userSelect: 'none',
        width: isSmall ? { xs: 34, sm: 40 } : { xs: 40, sm: 50 },
      }}
    />
  );
};

interface CasinoResultDetailModalProps {
  open: boolean;
  onClose: () => void;
  mid: string;
  gtype: string;
}

const getGameTitle = (gt: string) => {
  switch (gt) {
    case 'teen':
      return 'Teenpatti 1-day';
    case 'teen20':
      return '20-20 Teenpatti';
    case 'dt20':
      return 'Dragon Tiger 20-20';
    case 'lucky7eu':
      return 'Lucky 7';
    default:
      return (gt || 'Casino').toUpperCase();
  }
};

export default function CasinoResultDetailModal({ open, onClose, mid, gtype }: CasinoResultDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!open || !mid) {
      setResultData(null);
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    setError(null);

    axiosInstance
      .get(`${endpoints.casino.resultDetail}?mid=${mid}&gtype=${gtype || 'teen'}`, { timeout: 8000 })
      .then((res: any) => {
        if (!isMounted) return;
        const resObj = res.data;
        const t1Data =
          resObj?.data?.data?.t1 ||
          resObj?.data?.t1 ||
          resObj?.data?.data ||
          resObj?.data ||
          null;

        if (t1Data) {
          setResultData(t1Data);
        } else {
          setResultData({
            rid: mid,
            ename: getGameTitle(gtype),
            win: '1',
            winnat: 'Player A',
            card: '',
          });
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching casino result details:', err);
        setError('Failed to load result details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, mid, gtype]);

  // 10-Second Auto-close timer
  useEffect(() => {
    let timer: any = null;
    if (open) {
      timer = setTimeout(() => {
        onClose();
      }, 10000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, onClose]);

  const title = resultData?.ename || getGameTitle(gtype);
  const roundId = resultData?.rid || mid;
  const cardsRaw = resultData?.card || '';
  const cardsList = cardsRaw ? cardsRaw.split(',').map((c: string) => c.trim()).filter(Boolean) : [];

  const winnerNat = (resultData?.winnat || '').trim();
  const winCode = String(resultData?.win || '');

  const isPlayerAWinner =
    winCode === '1' ||
    winnerNat.toLowerCase().includes('player a') ||
    winnerNat.toLowerCase().includes('dragon');

  const isPlayerBWinner =
    winCode === '2' ||
    winnerNat.toLowerCase().includes('player b') ||
    winnerNat.toLowerCase().includes('tiger');

  // Split cards for Player A vs Player B
  // Sequence requirement: Player A => index 0, 2, 4 | Player B => index 1, 3, 5
  let playerACards: string[] = [];
  let playerBCards: string[] = [];

  if (gtype === 'teen' || gtype === 'teen20' || cardsList.length >= 6) {
    playerACards = [cardsList[0], cardsList[2], cardsList[4]].filter(Boolean);
    playerBCards = [cardsList[1], cardsList[3], cardsList[5]].filter(Boolean);
  } else if (gtype === 'dt20' || cardsList.length === 2) {
    playerACards = [cardsList[0]].filter(Boolean);
    playerBCards = [cardsList[1]].filter(Boolean);
  } else {
    playerACards = cardsList;
  }

  const playerAName = gtype === 'dt20' ? 'Dragon' : 'Player A';
  const playerBName = gtype === 'dt20' ? 'Tiger' : 'Player B';

  let winnerDisplay = winnerNat;
  if (!winnerDisplay) {
    if (isPlayerAWinner) {
      winnerDisplay = playerAName;
    } else if (isPlayerBWinner) {
      winnerDisplay = playerBName;
    } else {
      winnerDisplay = 'Player A';
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Box alignItems="center" display="flex" flexDirection="column" justifyContent="center" py={4}>
          <CircularProgress size={36} sx={{ color: '#16A34A', mb: 1.5 }} />
          <Typography color="text.secondary" variant="body2">
            Fetching result details...
          </Typography>
        </Box>
      );
    }

    if (error && !resultData) {
      return (
        <Box py={3} textAlign="center">
          <Typography color="error" fontWeight={600} mb={1}>
            {error}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Auto-closing in a few seconds...
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Main Hand Display */}
        {gtype === 'lucky7eu' ? (
          /* Lucky 7 layout */
          <Box alignItems="center" display="flex" flexDirection="column" my={2}>
            <Typography color="#1E293B" fontSize={{ xs: '14px', sm: '16px' }} fontWeight={700} mb={1.5}>
              Card Dealt
            </Typography>
            <Box alignItems="center" display="flex" justifyContent="center" mb={2}>
              <CardImage cardStr={resultData?.card || cardsList[0]} />
            </Box>

            {/* 4 Segment Results Breakdown */}
            {(() => {
              const rdesc = resultData?.rdesc || '';
              const parts = rdesc ? rdesc.split('#').map((p: string) => p.trim()) : [];
              const seg1 = parts[0] || (winnerNat.toLowerCase().includes('low') ? 'Low Card' : winnerNat.toLowerCase().includes('high') ? 'High Card' : 'Tie');
              const seg2 = parts[1] || '';
              const seg3 = parts[2] || '';
              const seg4 = parts[3] ? `Card ${parts[3]}` : '';

              const segmentList = [
                { label: 'Low / High', val: seg1 },
                { label: 'Even / Odd', val: seg2 },
                { label: 'Red / Black', val: seg3 },
                { label: 'Card Number', val: seg4 },
              ].filter((s) => Boolean(s.val));

              if (segmentList.length === 0) return null;

              return (
                <Box
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' },
                    gap: 1,
                    mt: 1,
                  }}
                >
                  {segmentList.map((seg, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        bgcolor: '#F0FDF4',
                        border: '1px solid #86EFAC',
                        borderRadius: '8px',
                        p: 1,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px', display: 'block' }}>
                        {seg.label}
                      </Typography>
                      <Typography sx={{ color: '#16A34A', fontWeight: 'bold', fontSize: '13px' }}>
                        {seg.val}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              );
            })()}
          </Box>
        ) : (
          /* 2-Player layout (Teen, Teen20, Dragon Tiger) */
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 1, sm: 2 },
              gridTemplateColumns: '1fr 1fr',
              my: { xs: 1.5, sm: 2.5 },
            }}
          >
            {/* Player A / Dragon Column */}
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: isPlayerAWinner ? '#F0FDF4' : '#F8FAFC',
                border: isPlayerAWinner ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 1, sm: 1.5 },
                transition: 'all 0.2s ease',
              }}
            >
              <Box alignItems="center" display="flex" justifyContent="center" mb={1} sx={{ minHeight: 28 }}>
                {isPlayerAWinner && (
                  <Iconify
                    icon="solar:cup-star-bold"
                    sx={{
                      color: '#16A34A',
                      mr: 0.5,
                    }}
                    width={22}
                  />
                )}
                <Typography
                  color={isPlayerAWinner ? '#16A34A' : '#1E293B'}
                  fontSize={{ xs: '14px', sm: '16px' }}
                  fontWeight={700}
                >
                  {playerAName}
                </Typography>
              </Box>

              <Box alignItems="center" display="flex" flexWrap="nowrap" justifyContent="center">
                {playerACards.map((c, i) => (
                  <React.Fragment key={i}>
                    <CardImage cardStr={c} />
                  </React.Fragment>
                ))}
              </Box>
            </Box>

            {/* Player B / Tiger Column */}
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: isPlayerBWinner ? '#F0FDF4' : '#F8FAFC',
                border: isPlayerBWinner ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 1, sm: 1.5 },
                transition: 'all 0.2s ease',
              }}
            >
              <Box alignItems="center" display="flex" justifyContent="center" mb={1} sx={{ minHeight: 28 }}>
                {isPlayerBWinner && (
                  <Iconify
                    icon="solar:cup-star-bold"
                    sx={{
                      color: '#16A34A',
                      mr: 0.5,
                    }}
                    width={22}
                  />
                )}
                <Typography
                  color={isPlayerBWinner ? '#16A34A' : '#1E293B'}
                  fontSize={{ xs: '14px', sm: '16px' }}
                  fontWeight={700}
                >
                  {playerBName}
                </Typography>
              </Box>

              <Box alignItems="center" display="flex" flexWrap="nowrap" justifyContent="center">
                {playerBCards.map((c, i) => (
                  <React.Fragment key={i}>
                    <CardImage cardStr={c} />
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* If DT20, display 8-Segment breakdown grid */}
        {gtype === 'dt20' && (() => {
          const rdesc = resultData?.rdesc || '';
          const parts = rdesc ? rdesc.split('#').map((p: string) => p.trim()) : [];
          const seg1 = parts[0] || (winnerNat || winnerDisplay);
          const seg2 = parts[1] || 'No';

          let seg3 = '';
          let seg4 = '';
          if (parts[2]) {
            const p2 = parts[2].split('|').map((s: string) => s.trim());
            p2.forEach((s: string) => {
              const l = s.toLowerCase();
              let val = s.replace(/^[dDtT]\s*:\s*/, '');
              if (l.includes('even')) {
                val = 'Even';
              } else if (l.includes('odd')) {
                val = 'Odd';
              }

              if (l.startsWith('d') || p2.indexOf(s) === 0) {
                seg3 = val;
              }
              if (l.startsWith('t') || p2.indexOf(s) === 1) {
                seg4 = val;
              }
            });
          }

          let seg5 = '';
          let seg6 = '';
          if (parts[3]) {
            const p3 = parts[3].split('|').map((s: string) => s.trim());
            p3.forEach((s: string) => {
              const l = s.toLowerCase();
              let val = s.replace(/^[dDtT]\s*:\s*/, '');
              if (l.includes('red')) {
                val = 'Red';
              } else if (l.includes('black')) {
                val = 'Black';
              }

              if (l.startsWith('d') || p3.indexOf(s) === 0) {
                seg5 = val;
              }
              if (l.startsWith('t') || p3.indexOf(s) === 1) {
                seg6 = val;
              }
            });
          }

          let seg7 = '';
          let seg8 = '';
          if (parts[4]) {
            const p4 = parts[4].split('|').map((s: string) => s.trim());
            p4.forEach((s: string) => {
              if (s.toUpperCase().startsWith('D') || p4.indexOf(s) === 0) {
                seg7 = s.replace(/^[dD]\s*:\s*/, '').trim();
              }
              if (s.toUpperCase().startsWith('T') || p4.indexOf(s) === 1) {
                seg8 = s.replace(/^[tT]\s*:\s*/, '').trim();
              }
            });
          }

          const segmentList = [
            { label: 'Winner', val: seg1 },
            { label: 'Pair', val: seg2 },
            { label: 'Dragon E/O', val: seg3 },
            { label: 'Tiger E/O', val: seg4 },
            { label: 'Dragon R/B', val: seg5 },
            { label: 'Tiger R/B', val: seg6 },
            { label: 'Dragon Card', val: seg7 ? `Card ${seg7}` : '' },
            { label: 'Tiger Card', val: seg8 ? `Card ${seg8}` : '' },
          ].filter((s) => Boolean(s.val));

          if (segmentList.length === 0) return null;

          return (
            <Box
              sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
                gap: 0.8,
                mt: 1.5,
              }}
            >
              {segmentList.map((seg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    bgcolor: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: '6px',
                    p: 0.8,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '10px', display: 'block', lineHeight: 1.1 }}>
                    {seg.label}
                  </Typography>
                  <Typography sx={{ color: '#16A34A', fontWeight: 'bold', fontSize: '12px', mt: 0.2 }}>
                    {seg.val}
                  </Typography>
                </Box>
              ))}
            </Box>
          );
        })()}

        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

        {/* Winner Footer */}
        <Box
          sx={{
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            px: 2,
            py: 1.2,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              color: '#1E293B',
              fontSize: { xs: '14px', sm: '16px' },
              fontWeight: 800,
            }}
          >
            Winner: <Box component="span" sx={{ color: '#16A34A' }}>{winnerDisplay}</Box>
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: {
          bgcolor: '#FFFFFF',
          borderRadius: { xs: '10px', sm: '14px' },
          boxShadow: '0 10px 35px rgba(0,0,0,0.2)',
          m: { xs: 1, sm: 2 },
          maxWidth: { xs: '92vw', sm: '420px' },
          p: { xs: 1.5, sm: 2.5 },
        },
      }}
    >
      {/* Header */}
      <Box alignItems="center" display="flex" justifyContent="space-between" mb={0.5}>
        <Typography color="#1E293B" fontWeight={700} sx={{ fontSize: { xs: '16px', sm: '19px' } }} variant="h6">
          {title} Result
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ '&:hover': { bgcolor: '#F1F5F9' }, color: '#64748B' }}>
          <Iconify icon="eva:close-fill" width={20} />
        </IconButton>
      </Box>

      {/* Round ID */}
      <Typography color="#64748B" fontSize={{ xs: '12px', sm: '13px' }} fontWeight={700} mb={1.5} variant="body2">
        Round Id: {roundId}
      </Typography>

      <Divider sx={{ mb: 1.5 }} />

      {renderContent()}
    </Dialog>
  );
}
