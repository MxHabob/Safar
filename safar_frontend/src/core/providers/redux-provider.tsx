"use client"

import React, { useEffect, useState } from "react"
import { persistor, store } from "@/core/store"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
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