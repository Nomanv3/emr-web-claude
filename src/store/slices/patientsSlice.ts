import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Patient } from '@/types';

interface PatientsState {
  list: Patient[];
  total: number;
  page: number;
  searchQuery: string;
  isLoading: boolean;
}

const initialState: PatientsState = {
  list: [],
  total: 0,
  page: 1,
  searchQuery: '',
  isLoading: false,
};

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setPatients(state, action: PayloadAction<{ patients: Patient[]; total: number }>) {
      state.list = action.payload.patients;
      state.total = action.payload.total;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setPatients, setPage, setSearchQuery, setLoading } = patientsSlice.actions;
export default patientsSlice.reducer;
