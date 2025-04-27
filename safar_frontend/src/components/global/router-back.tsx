"use client";
import { ArrowLeft } from "lucide-react"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

export const RouterBack = () => {
     const router = useRouter()
    return (
        <Button 
          variant="ghost" 
          onClick={() => router.replace("/")} 
          className="rounded-full p-2 hover:bg-accent transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
    )
}