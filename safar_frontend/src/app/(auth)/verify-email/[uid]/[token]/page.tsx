"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Plane } from "lucide-react"
import { useAuth } from "@/redux/hooks/useAuth"

export default function VerifyEmailPage() {
  const { uid, token } = useParams() as { uid: string; token: string }
  const { verifyEmail } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await verifyEmail({ uid, token })
        if (result.success) {
          setStatus("success")
        } else {
          setStatus("error")
          setErrorMessage(result.error || "Verification failed")
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setStatus("error")
        setErrorMessage("An unexpected error occurred")
      }
    }

    verify()
  }, [uid, token, verifyEmail])

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
      <Card className="border-sky-100 bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-center text-xl bg-gradient-to-r from-sky-600 to-emerald-500 text-transparent bg-clip-text">
            Email Verification
          </CardTitle>
          <CardDescription className="text-center">
            {status === "loading" && "Preparing for takeoff..."}
            {status === "success" && "You're all set for your journey!"}
            {status === "error" && "We've hit some turbulence"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          {status === "loading" && (
            <div className="relative">
              <Plane className="h-16 w-16 text-sky-500 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              </div>
            </div>
          )}
          {status === "success" && <CheckCircle className="h-16 w-16 text-emerald-500" />}
          {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {status === "error" && <p className="text-sm text-red-500">{errorMessage}</p>}
          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full bg-gradient-to-r from-sky-600 to-emerald-500 hover:from-sky-700 hover:to-emerald-600"
          >
            {status === "success" ? "Continue to Login" : "Back to Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

