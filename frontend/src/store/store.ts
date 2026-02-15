import { configureStore, combineReducers } from '@reduxjs/toolkit';
import storage from 'localforage';
import { persistReducer, persistStore } from 'redux-persist';
import interviewReducer from '../slices/interviewSlice';
import authReducer from '../slices/authSlice';

const rootReducer = combineReducers({
  interview: interviewReducer,
  auth: authReducer
});

const persistConfig = {
  key: 'root',
  storage,
  version: 1
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


