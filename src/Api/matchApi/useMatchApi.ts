// useEmployeeApi.ts

import { useCallback } from 'react';

import useApi from 'src/server/axios/index';
import { Endpoints } from 'src/server/endpoints_configuration/Endpoints';

import { toast } from 'src/components/snackbar';

const useMatchApi = () => {
  const { get, patch, post } = useApi();

  const fetchAllMatchs = async () => {
    try {
      const response = await get(`${Endpoints.fetchAllMatch}`);
      return response;
    } catch (error) {
      console.error('Error fetch Match', error);
      toast.error('Failed to fetch Match');
      throw error;
    }
  };
  const fetchAllMatch = async () => {
    try {
      const response = await get(`${Endpoints.fetchAllMatch}/true`);
      return response;
    } catch (error) {
      console.error('Error fetch Match', error);
      toast.error('Failed to fetch Match');
      throw error;
    }
  };

  const FatchUpdateMatchData = async (id: string) => {
    try {
      const response = await get(`${Endpoints.FatchUpdateMatchData}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const FatchMatchData = async (id: string) => {
    try {
      const response = await get(`${Endpoints.FatchUpdateMatchData}/${id}/all`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const updateTogalStatus = useCallback(
    async (id: string) => {
      try {
        const response = await patch(`${Endpoints.updateStatus}/${id}`, {});
        toast.success('Status updated successfully');
        return response;
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Failed to toggle status');
        throw error;
      }
    },
    [patch]
  );



  const updateStatusSession = useCallback(
    async (id: string, sid: string) => {
      try {
        const response = await patch(`${Endpoints.updateStatusSession}/${id}/${sid}`, {});
        toast.success('Status updated successfully');
        return response;
      } catch (error) {
        toast.error('Failed to toggle status');
        throw error;
      }
    },
    [patch]



  );

  const FatchUpdateMatch = async (id: string) => {
    try {
      const response = await get(`${Endpoints.FatchUpdateData}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const DeclareMatch = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.DeclareMatch}/${id}`, payload);

        toast.success(response?.data?.message);

        return response;
      } catch (error: any) {
        console.error('Error declaring match:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to declare match';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );
  const CancelMatch = useCallback(
    async (id: string) => {
      try {
        const response = await post(`${Endpoints.CancelMatch}/${id}`, {});

        toast.success(response?.data?.message);

        return response;
      } catch (error: any) {
        console.error('Error declaring match:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to declare match';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );
  const DeclarefancyMatch = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.DeclareFancyMatch}/${id}`, payload);
        return response;
      } catch (error: any) {
        console.error('Error declaring fancy session:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to declare fancy session';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );
  const CancelfancyMatch = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.CancelFancyMatch}/${id}`, payload);

        toast.success(response?.data?.message);

        return response;
      } catch (error: any) {
        console.error('Error declaring match:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to declare match';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]

  );


  const fancyRollBack = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.FancyRollBack}/${id}`, payload);
        toast.success(response?.message || 'FancyRollBack successfully');
        return response;
      } catch (error: any) {
        console.error('FancyRollBack:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to FancyRollBack';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );
  const matchRollback = useCallback(
    async (id: string) => {
      try {
        const response = await post(`${Endpoints.MatchRollBack}/${id}`, {});
        toast.success(response?.message || 'MatchRollBack successfully');
        return response;
      } catch (error: any) {
        console.error('Error MatchRollBack:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to MatchRollBack';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );

  const toggleToss = useCallback(
    async (id: string) => {
      try {
        const response = await patch(`${Endpoints.toggleToss}/${id}`, {});
        toast.success('Toss status updated successfully');
        return response;
      } catch (error: any) {
        console.error('Error toggling toss status:', error);
        const errMsg = error?.response?.data?.message || 'Failed to toggle toss status';
        toast.error(errMsg);
        throw error;
      }
    },
    [patch]
  );

  const DeclareTossMatch = useCallback(
    async (id: string, payload: any) => {
      try {
        const response = await post(`${Endpoints.DeclareTossMatch}/${id}`, payload);
        toast.success(response?.message || 'Toss declared successfully');
        return response;
      } catch (error: any) {
        console.error('Error declaring toss:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to declare toss';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );

  const tossRollBack = useCallback(
    async (id: string, payload?: any) => {
      try {
        const response = await post(`${Endpoints.TossRollBack}/${id}`, payload || {});
        toast.success(response?.message || 'Toss rolled back successfully');
        return response;
      } catch (error: any) {
        console.error('Error rolling back toss:', error);
        const errorMessage = error?.response?.data?.message || 'Failed to rollback toss';
        toast.error(errorMessage);
        throw error;
      }
    },
    [post]
  );

  const Matchdelay = useCallback(
    async (id: string, delay: number, min: number, max: number) => {
      try {
        const response = await patch(`${Endpoints.Matchdelay}`, { id, delay, min, max });
        toast.success('Status updated successfully');
        return response;
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Failed to toggle status');
        throw error;
      }
    },
    [patch]



  );
  const FetchBetData = async (id: string) => {
    try {
      const response = await get(`${Endpoints.Matchdelay}/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Data', error);
      throw error;
    }
  };
  const fetchTableData = async (_id: string, matchId: string) => {
    try {
      const response = await get(`${Endpoints.fetchTableData}/${_id}/${matchId}`);
      return response;
    } catch (error) {
      console.error('Error fetch Table Data', error);
      throw error;
    }
  };
  const fetchTotalData = async (_id: string) => {
    try {
      const response = await get(`${Endpoints.fetchTotalData}/${_id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Total Data', error);
      // toast.error('Failed to fetch Total Data');
      throw error;
    }
  };
  const fetchUndeclaredBets = async (_id: string) => {
    try {
      const response = await get(`${Endpoints.fetchUndeclaredBets}/${_id}`);
      return response;
    } catch (error) {
      console.error('Error fetch Undeclared Bets', error);
      throw error;
    }
  };
  const fetchSettlement = async (_id: string) => {
    try {
      const response = await get(`${Endpoints.Settlement}/get/${_id}`);
      return response;
    } catch (error) {
      console.error('Error fetchSettlement', error);
      throw error;
    }
  };
  const fetchMySettlement = async (_id: string) => {
    try {
      const response = await get(`${Endpoints.Settlement}/get/to/${_id}`);
      return response;
    } catch (error) {
      console.error('Error fetchSettlement', error);
      throw error;
    }
  };
  const AddSettlement = useCallback(
    async (payload: any) => {
      try {
        const response = await post(`${Endpoints.Settlement}/create`, payload);

        toast.success(response?.status);

        return response;
      } catch (error: any) {
        console.error('Error Add Settlement:', error);

        const errorMessage =
          error?.response?.data?.message || 'Failed to  Add Settlement';
        toast.error(errorMessage);

        throw error;
      }
    },
    [post]
  );
  const Exposure = async (adminId: string, matchId: string) => {
    try {
      const response = await get(`${Endpoints.Exposure}/${adminId}/${matchId}`);
      return response;
    } catch (error) {
      console.error('Error fetchSettlement', error);
      throw error;
    }
  };
  const updateStatusMInMax = useCallback(
    async (payload: { id: string; min: number; max: number }) => {
      try {
        const response = await patch(`${Endpoints.updateStatusMInMax}`, payload);

        toast.success('Status updated successfully');
        return response;

      } catch (error) {
        console.error('Error updating min/max:', error);
        toast.error('Failed to update min/max');
        throw error;
      }
    },
    [patch]
  );

    const AutoDeclareRun = useCallback(
      async (matchId: string) => {
        try {
          const response = await post(`${Endpoints.AutoDeclare}/run/${matchId}`,{});
  
          toast.success(response?.status || "Auto Declare Success");
  
          return response;
        } catch (error: any) {
          console.error('Error Auto Declare:', error);
  
          const errorMessage =
            error?.response?.data?.message || 'Failed to Auto Declare';
  
          toast.error(errorMessage);
  
          throw error;
        }
      },
      [post]
    );
  
    const fetchCommissionSummary = async (agentId: string, fromDate?: string, toDate?: string) => {
      try {
        let url = `${Endpoints.commissionSummary}/${agentId}`;
        const queryParams = [];
        if (fromDate) queryParams.push(`fromDate=${fromDate}`);
        if (toDate) queryParams.push(`toDate=${toDate}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
        
        const response = await get(url);
        return response;
      } catch (error) {
        console.error('Error fetching commission summary:', error);
        throw error;
      }
    };
  
    const fetchCommissionMatches = async (agentId: string, fromDate?: string, toDate?: string, clientId?: string) => {
      try {
        let url = `${Endpoints.commissionMatches}/${agentId}`;
        const queryParams = [];
        if (fromDate) queryParams.push(`fromDate=${fromDate}`);
        if (toDate) queryParams.push(`toDate=${toDate}`);
        if (clientId) queryParams.push(`clientId=${clientId}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
        
        const response = await get(url);
        return response;
      } catch (error) {
        console.error('Error fetching commission matches:', error);
        return null;
      }
    };
  
    const fetchCommissionClients = async (agentId: string, fromDate?: string, toDate?: string) => {
      try {
        let url = `${Endpoints.commissionClients}/${agentId}`;
        const queryParams = [];
        if (fromDate) queryParams.push(`fromDate=${fromDate}`);
        if (toDate) queryParams.push(`toDate=${toDate}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
        
        const response = await get(url);
        return response;
      } catch (error) {
        console.error('Error fetching commission clients:', error);
        throw error;
      }
    };
  
    const fetchCommissionLedgerHistory = async (agentId: string, fromDate?: string, toDate?: string) => {
      try {
        let url = `${Endpoints.commissionLedgerHistory}/${agentId}`;
        const queryParams = [];
        if (fromDate) queryParams.push(`fromDate=${fromDate}`);
        if (toDate) queryParams.push(`toDate=${toDate}`);
        if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
        
        const response = await get(url);
        return response;
      } catch (error) {
        console.error('Error fetching commission ledger history:', error);
        throw error;
      }
    };
  
    const settleAgentCommission = useCallback(
      async (payload: { agentId: string; userId: string; matchId?: string }) => {
        try {
          const response = await post(`${Endpoints.commissionAgentSettle}`, payload);
          toast.success(response?.data?.message || 'Commission settled successfully');
          return response;
        } catch (error: any) {
          console.error('Error settling agent commission:', error);
          const errorMessage = error?.response?.data?.message || 'Failed to settle commission';
          toast.error(errorMessage);
          throw error;
        }
      },
      [post]
    );

    const fetchCommissionHistory = async (userId: string) => {
      try {
        const response = await get(`${Endpoints.commissionHistory}/${userId}`);
        return response;
      } catch (error) {
        console.error('Error fetching commission history:', error);
        throw error;
      }
    };

  const fetchAdminMyLedger = async (adminId: string) => {
    try {
      const response = await get(`${Endpoints.MyLedger}/${adminId}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin my ledger', error);
      throw error;
    }
  };

  const fetchAdminChildLedger = async (adminId: string, clientFilter: string = '') => {
    try {
      const queryParam = clientFilter ? `?client=${encodeURIComponent(clientFilter)}` : '';
      const response = await get(`${Endpoints.ChildLedger}/${adminId}${queryParam}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin child ledger', error);
      throw error;
    }
  };

  const fetchAdminSettlement = async (adminId: string) => {
    try {
      const response = await get(`${Endpoints.SettlementLedger}/${adminId}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin settlement', error);
      throw error;
    }
  };

  const fetchAdminTotalProfit = async (adminId: string) => {
    try {
      const response = await get(`${Endpoints.TotalProfitLedger}/${adminId}`);
      return response;
    } catch (error) {
      console.error('Error fetching admin total profit', error);
      throw error;
    }
  };

  const fetchAdminSuperReport = async (
    adminId: string,
    childAdminId?: string,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      let url = childAdminId
        ? `${Endpoints.SuperReportLedger}/${adminId}/${childAdminId}`
        : `${Endpoints.SuperReportLedger}/${adminId}`;

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await get(url);
      return response;
    } catch (error) {
      console.error('Error fetching admin super report', error);
      throw error;
    }
  };

  return {
    updateStatusSession,
    fetchAllMatchs,
    fetchAllMatch,
    updateTogalStatus,
    FatchUpdateMatchData,
    FatchUpdateMatch,
    fetchAdminMyLedger,
    fetchAdminChildLedger,
    fetchAdminSettlement,
    fetchAdminTotalProfit,
    fetchAdminSuperReport,
    DeclareMatch,
    DeclarefancyMatch,
    CancelMatch,
    CancelfancyMatch,
    fancyRollBack,
    matchRollback,
    toggleToss,
    DeclareTossMatch,
    tossRollBack,
    FatchMatchData,
    Matchdelay,
    FetchBetData,
    fetchTableData,
    fetchUndeclaredBets,
    fetchTotalData,
    fetchSettlement,
    AddSettlement,
    Exposure,
    fetchMySettlement,
    updateStatusMInMax,
    AutoDeclareRun,
    fetchCommissionSummary,
    fetchCommissionMatches,
    fetchCommissionClients,
    fetchCommissionLedgerHistory,
    settleAgentCommission,
    fetchCommissionHistory
  };
};

export default useMatchApi;
