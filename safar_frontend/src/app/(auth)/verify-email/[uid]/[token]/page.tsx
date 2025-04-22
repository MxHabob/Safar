/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/core/hooks/use-auth"

export default function VerifyEmailPage() {
  const { uid, token } = useParams() as { uid: string; token: string }
  const { verifyEmail, isVerifyEmailLoading } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(isVerifyEmailLoading ? "loading" : "idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (status !== "idle") return

    const verifyEmailToken = async () => {
      setStatus("loading")
      try {
        const result = await verifyEmail({ uid, token })
        
        if (result.success) {
          setStatus("success")
        } else {
          setStatus("error")
          setErrorMessage(result.error || "Email verification failed")
        }
      } catch (error) {
        setStatus("error")
        setErrorMessage("An unexpected error occurred")
      }
    }

    verifyEmailToken()
  }, [uid, token, verifyEmail, status])

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription className="text-sm">
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Your email has been successfully verified!"}
            {status === "error" && "We couldn't verify your email address"}
            {status === "idle" && "Preparing verification..."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex justify-center py-6">
          {status === "loading" || status === "idle" ? (
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          ) : status === "success" ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {status === "error" && (
            <div className="text-center text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          
          <Button 
            onClick={() => router.push("/login")} 
            className="w-full"
            variant={status === "error" ? "destructive" : "default"}
            disabled={status === "loading"}
          >
            {status === "success" ? "Continue to Login" : "Back to Login"}
          </Button>

          {status === "error" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStatus("idle")
                setErrorMessage("")
              }}
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}