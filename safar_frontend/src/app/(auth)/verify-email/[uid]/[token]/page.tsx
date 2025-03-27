"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"
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
      } catch (error) {
        setStatus("error")
        setErrorMessage("An unexpected error occurred")
      }
    }

    verify()
  }, [uid, token, verifyEmail])

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[450px]">
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Your email has been verified!"}
            {status === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          {status === "loading" && (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
          {status === "success" && <CheckCircle className="h-16 w-16 text-green-500" />}
          {status === "error" && <XCircle className="h-16 w-16 text-red-500" />}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {status === "error" && <p className="text-sm text-red-500">{errorMessage}</p>}
          <Button onClick={() => router.push("/sign-in")} className="w-full">
            {status === "success" ? "Proceed to Login" : "Back to Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

