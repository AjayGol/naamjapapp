import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../theme/types';

const STORAGE_KEY = 'naamjap.themeMode';

export type SettingsState = {
  themeMode: ThemeMode;
  hydrated: boolean;
};

const initialState: SettingsState = {
  themeMode: 'system',
  hydrated: false,
};

export const hydrateSettings = createAsyncThunk('settings/hydrate', async () => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored as ThemeMode;
  }
  return 'system' as ThemeMode;
});

export const persistThemeMode = createAsyncThunk(
  'settings/persistThemeMode',
  async (mode: ThemeMode) => {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
    return mode;
  },
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(hydrateSettings.fulfilled, (state, action) => {
        state.themeMode = action.payload;
        state.hydrated = true;
      })
      .addCase(hydrateSettings.rejected, state => {
        state.hydrated = true;
      })
      .addCase(persistThemeMode.fulfilled, (state, action) => {
        state.themeMode = action.payload;
      });
  },
});

export const { setThemeMode } = settingsSlice.actions;

export default settingsSlice.reducer;
