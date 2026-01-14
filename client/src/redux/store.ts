// src/redux/store.ts  (hoặc src/store.ts)

import { configureStore } from '@reduxjs/toolkit';

// Chỉ import api slices VÀO store, KHÔNG import store VÀO api slice
import { invitationsApi } from './api/invitationsApi';      // ← đường dẫn tương đối từ store.ts
import { assignmentsApi } from './api/assignmentsApi';
import { apiSlice } from './api/apiSlice';                 // nếu còn dùng

export const store = configureStore({
  reducer: {
    [invitationsApi.reducerPath]: invitationsApi.reducer,
    [assignmentsApi.reducerPath]: assignmentsApi.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    // thêm reducer khác nếu có
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      invitationsApi.middleware,
      assignmentsApi.middleware,
      apiSlice.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;