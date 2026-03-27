import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { format } from 'date-fns';

interface SelectedDateState {
  date: string;
}

const initialState: SelectedDateState = {
  date: format(new Date(), 'yyyy-MM-dd'),
};

const selectedDateSlice = createSlice({
  name: 'selectedDate',
  initialState,
  reducers: {
    setSelectedDate(state, action: PayloadAction<string>) {
      state.date = action.payload;
    },
  },
});

export const { setSelectedDate } = selectedDateSlice.actions;
export default selectedDateSlice.reducer;
