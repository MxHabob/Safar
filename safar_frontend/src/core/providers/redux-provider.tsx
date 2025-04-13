"use client"

import type React from "react"

import { persistor, store } from "@/core/store"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"


export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {


  if (!persistor) {
    return <Provider store={store}>{children}</Provider>
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
