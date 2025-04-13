import { PayloadAction, createSlice } from "@reduxjs/toolkit"

interface ScrollableItem {
  id: string | number;
  [key: string]: unknown;
}

type InitialStateProps = {
  data: ScrollableItem[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

const InitialState: InitialStateProps = {
  data: [],
  page: 1,
  hasMore: true,
  isLoading: false,
  error: null,
}

export const InfiniteScroll = createSlice({
  name: "InfiniteScroll",
  initialState: InitialState,
  reducers: {
    fetchStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSuccess: (state, action: PayloadAction<{ data: ScrollableItem[]; hasMore: boolean }>) => {
      const newItems = action.payload.data.filter(newItem => 
        !state.data.some(existingItem => existingItem.id === newItem.id)
      );
      state.data = [...state.data, ...newItems];
      state.hasMore = action.payload.hasMore;
      state.page = newItems.length > 0 ? state.page + 1 : state.page;
      state.isLoading = false;
    },
    fetchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    resetState: (state) => {
      state.data = [];
      state.page = 1;
      state.hasMore = true;
      state.isLoading = false;
      state.error = null;
    },
  },
})

export const { fetchStart, fetchSuccess, fetchFailure, resetState } = InfiniteScroll.actions;
export default InfiniteScroll.reducer;