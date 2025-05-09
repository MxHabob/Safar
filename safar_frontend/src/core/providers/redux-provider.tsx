"use client"
import { persistor, store } from "@/core/store"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { QueryProvider } from "./query-provider"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryProvider>
         {children}
        </QueryProvider>
      </PersistGate>
    </Provider>
  )
}