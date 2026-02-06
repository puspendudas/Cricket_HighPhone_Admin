import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { fetchClientAnnouncementData } from 'src/Api/announcementApi/announcementService';

export const fetchAnnouncements = createAsyncThunk<
    { marqueeText: string; hasActiveStatus: boolean },
    string | undefined,
    { rejectValue: string }
>(
    'announcements/fetchAnnouncements',
    async (gameId, { rejectWithValue }) => {
        try {
            const response = await fetchClientAnnouncementData();

            // Defensive filter for user_type and gameId matching (string safe)
            const filtered = response.data
                .filter((item: any) => (item.user_type === 'all' || item.user_type === 'admin'))
                .filter((item: any) => {
                    if (!gameId) return true;
                    return String(item.match_id?.gameId) === String(gameId);
                })
                .filter((item: any) => item.status === true);

            // Check if any announcement has status true
            const hasActiveStatus = filtered.length > 0;

            const marqueeText = filtered
                .map((item: any) => `${item.body} || ${item.match_id?.eventName || ''}`)
                .join(' • ');


            return { marqueeText, hasActiveStatus };
        } catch (error) {
            console.error('Failed to load marquee announcement', error);
            return rejectWithValue('Failed to load announcements');
        }
    }
);

interface AnnouncementState {
    marqueeText: string;
    loading: boolean;
    error: string | null;
    hasActiveStatus: boolean; // Track if any active announcement
}

const initialState: AnnouncementState = {
    marqueeText: '',
    loading: false,
    error: null,
    hasActiveStatus: false,
};

const announcementSlice = createSlice({
    name: 'announcements',
    initialState,
    reducers: {
        clearAnnouncements: (state) => {
            state.marqueeText = '';
            state.error = null;
            state.hasActiveStatus = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAnnouncements.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAnnouncements.fulfilled, (state, action) => {
                state.loading = false;
                state.marqueeText = action.payload.marqueeText;
                state.hasActiveStatus = action.payload.hasActiveStatus;
            })
            .addCase(fetchAnnouncements.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.hasActiveStatus = false;
            });
    },
});

export const { clearAnnouncements } = announcementSlice.actions;
export default announcementSlice.reducer;
