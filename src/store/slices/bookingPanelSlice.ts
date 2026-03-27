import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface BookingPanelState {
  isOpen: boolean;
  selectedPatientId: string | null;
}

const initialState: BookingPanelState = {
  isOpen: false,
  selectedPatientId: null,
};

const bookingPanelSlice = createSlice({
  name: 'bookingPanel',
  initialState,
  reducers: {
    openBookingPanel(state, action: PayloadAction<string | undefined>) {
      state.isOpen = true;
      state.selectedPatientId = action.payload ?? null;
    },
    closeBookingPanel(state) {
      state.isOpen = false;
      state.selectedPatientId = null;
    },
  },
});

export const { openBookingPanel, closeBookingPanel } = bookingPanelSlice.actions;
export default bookingPanelSlice.reducer;
