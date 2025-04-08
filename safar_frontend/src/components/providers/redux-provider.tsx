"use client"

import type React from "react"

import { type AppStore, makeStore } from "@/redux/store"
import { useRef, useState, useEffect } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"
import { persistStore } from "redux-persist"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [persistor, setPersistor] = useState<any>(null)

  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  useEffect(() => {
    if (storeRef.current && !persistor) {
      setPersistor(persistStore(storeRef.current))
    }
  }, [persistor])

  // Don't render PersistGate until persistor is created on the client
  if (!persistor) {
    return <Provider store={storeRef.current}>{children}</Provider>
  }

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
