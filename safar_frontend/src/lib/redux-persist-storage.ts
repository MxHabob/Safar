import createWebStorage from "redux-persist/lib/storage/createWebStorage"

// A custom storage solution that uses localStorage on the client and a no-op storage on the server
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null)
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value)
    },
    removeItem(_key: string) {
      return Promise.resolve()
    },
  }
}

// Create a storage that works in both client and server environments
const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage()

export default storage
