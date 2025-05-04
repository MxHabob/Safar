import { cn } from "@/lib/utils"
import React from "react"
import { Spinner } from "../ui/spinner"

type LoaderProps = {
  loading: boolean
  children?: React.ReactNode
  className?: string
}

export const Loader = ({ loading, children, className }: LoaderProps) => {
  return loading ? (
    <div className={cn("w-full flex justify-center items-center", className)}>
      <Spinner/>
    </div>
  ) : (
    children
  )
}
