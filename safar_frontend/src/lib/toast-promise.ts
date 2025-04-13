import { toast } from "sonner"

type PromiseOptions<T> = {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: any) => string)
}

export function toastPromise<T>(promise: Promise<T>, options: PromiseOptions<T>): Promise<T> {
  return toast.promise(promise, {
    loading: options.loading,
    success: (data) => {
      return typeof options.success === "function" ? options.success(data) : options.success
    },
    error: (error) => {
      return typeof options.error === "function" ? options.error(error) : options.error
    },
  })
}
