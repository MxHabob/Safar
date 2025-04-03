import type React from "react"
import { cn } from "@/lib/utils"
import { Check, Shield } from "lucide-react"
import { CardContainer } from "@/components/ui/card-container"

interface VerificationItem {
  label: string
  verified: boolean
}

interface VerificationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  verifications: VerificationItem[]
}

export function VerificationCard({ name, verifications, className, ...props }: VerificationCardProps) {
  return (
    <CardContainer
      variant="glass"
      className={cn("hover:shadow-medium transition-all duration-300", className)}
      {...props}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600">
          <Shield className="h-4 w-4" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">{name}&apos;s confirmed information</h3>
      </div>

      <ul className="space-y-4">
        {verifications.map((item, index) => (
          <li key={index} className="flex items-center gap-3">
            {item.verified ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-dashed border-slate-200" />
            )}
            <span className="text-slate-700">{item.label}</span>
          </li>
        ))}
      </ul>
    </CardContainer>
  )
}

