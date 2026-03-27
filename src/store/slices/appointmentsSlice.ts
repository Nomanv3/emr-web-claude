import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Appointment } from '@/types';

interface AppointmentsState {
  list: Appointment[];
  isLoading: boolean;
}

const initialState: AppointmentsState = {
  list: [],
  isLoading: false,
};

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setAppointments(state, action: PayloadAction<Appointment[]>) {
      state.list = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setAppointments, setLoading } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
