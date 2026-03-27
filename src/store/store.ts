import { configureStore } from '@reduxjs/toolkit';
import patientsReducer from './slices/patientsSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import selectedDateReducer from './slices/selectedDateSlice';
import bookingPanelReducer from './slices/bookingPanelSlice';

export const store = configureStore({
  reducer: {
    patients: patientsReducer,
    appointments: appointmentsReducer,
    selectedDate: selectedDateReducer,
    bookingPanel: bookingPanelReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
