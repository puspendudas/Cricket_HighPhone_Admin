// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';

import announcementReducer from './slices/announcementSlice';

export const store = configureStore({
  reducer: {
    announcements: announcementReducer,
    // aur reducers yahan add karen
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
