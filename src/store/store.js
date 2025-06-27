import { configureStore } from "@reduxjs/toolkit";

import provider from "./reducers/provider";
import tokens from "./reducers/tokens";
import amm from "./reducers/amm"
import faucet from "./reducers/Faucet"

export const store = configureStore({
  reducer: {
    provider,
    tokens,
    amm,
    faucet
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    }),
});
