import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import { combineReducers } from "redux";
import { api } from "@/core/services/api";
import authReducer from "@/core/features/auth/auth-slice";
import realtimeReducer from "@/core/features/realtime/realtime-slice";
import modalReducer from "@/core/features/ui/modal-slice";
import scrollReducer from "@/core/features/ui/infinite-scroll-slice";
import { storage } from "@/lib/redux-persist-storage";

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  realtime: realtimeReducer,
  modal: modalReducer,
  scroll: scrollReducer,
});

export const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
  blacklist: [api.reducerPath],
  version: 1,
  timeout: 5000,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(api.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const store = makeStore();
export const persistor = persistStore(store);

let hasInitializedAuth = false;

persistor.subscribe(() => {
  const { bootstrapped } = persistor.getState();
  if (bootstrapped && !hasInitializedAuth && typeof window !== "undefined") {
    const state = store.getState();
    if (state.auth.accessToken) {
      store.dispatch(api.endpoints.getUser.initiate())
        .then(() => console.debug("Initial auth check complete"))
        .catch(() => console.debug("Initial auth check failed"));
    }
    hasInitializedAuth = true;
  }
});