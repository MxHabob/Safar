"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ActionButton } from "@/components/ui/action-button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Bug, 
  Lightbulb, 
  Star,
  CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateFeedbackApiV1FeedbackPostMutation } from "@/generated/hooks/feedback"
import type { FeedbackType } from "@/generated/schemas"
import { useModal } from "@/lib/stores/modal-store"

const feedbackTypes: { type: FeedbackType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { 
    type: "correction", 
    label: "Correction", 
    icon: CheckCircle2,
    description: "The prediction was incorrect" 
  },
  { 
    type: "improvement", 
    label: "Improvement", 
    icon: Lightbulb,
    description: "Suggest an improvement" 
  },
  { 
    type: "bug_report", 
    label: "Bug Report", 
    icon: Bug,
    description: "Report a bug or issue" 
  },
  { 
    type: "feature_request", 
    label: "Feature Request", 
    icon: Star,
    description: "Request a new feature" 
  },
  { 
    type: "general", 
    label: "General", 
    icon: MessageSquare,
    description: "General feedback" 
  },
]

export function AnalysisFeedbackModal() {
  const { isOpen, type, data, onClose } = useModal()
  const isActive = isOpen && type === "analysisFeedback"
  
  // Get data from modal store
  const resultId = data?.analysisResultId
  const resultPrediction = data?.prediction
  
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null)
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createFeedbackMutation = useCreateFeedbackApiV1FeedbackPostMutation({
    showToast: true,
    onSuccess: () => {
      setComment("")
      setRating(null)
      setIsCorrect(null)
      setSelectedType(null)
      onClose()
    },
  })

  const handleSubmit = async () => {
    if (!selectedType) {
      // Validation error - can be shown via UI state
      return
    }

    if (!comment.trim() && selectedType !== "correction") {
      // Validation error - can be shown via UI state
      return
    }

    if (selectedType === "correction" && isCorrect === null) {
      // Validation error - can be shown via UI state
      return
    }

    setIsSubmitting(true)

    try {
      await createFeedbackMutation.mutateAsync({
        body: {
          feedback_type: selectedType,
          analysis_result_id: resultId,
          comment: comment.trim() || undefined,
          rating: rating || undefined,
          original_prediction: resultPrediction || undefined,
          corrected_prediction: isCorrect === false ? (resultPrediction === "real" ? "fake" : "real") : undefined,
        },
        params: {},
      })
    } catch (error) {
      // Error handled in onError callback
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = selectedType && (comment.trim() || selectedType === "correction") && 
    (selectedType !== "correction" || isCorrect !== null)

  return (
    <Dialog 
      open={isActive} 
      onOpenChange={(open) => (!open ? onClose() : undefined)}
      key={isActive ? "open" : "closed"}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span>Share Your Feedback</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Help us improve by sharing your thoughts about this analysis
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
        {/* Feedback Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Feedback Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {feedbackTypes.map(({ type, label, icon: Icon, description }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "group relative p-3 rounded-xl border transition-all duration-200 text-left",
                  "hover:border-primary/60 hover:bg-primary/5",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                  selectedType === type
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-card/50"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors flex-shrink-0",
                    selectedType === type 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs mb-0.5">{label}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Correction Feedback */}
        {selectedType === "correction" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="text-xs font-medium text-muted-foreground">Was the prediction correct?</label>
            <div className="flex gap-2">
              <Button
                variant={isCorrect === true ? "default" : "outline"}
                onClick={() => setIsCorrect(true)}
                className="flex-1 h-9 rounded-xl text-sm"
              >
                <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                Correct
              </Button>
              <Button
                variant={isCorrect === false ? "default" : "outline"}
                onClick={() => setIsCorrect(false)}
                className="flex-1 h-9 rounded-xl text-sm"
              >
                <ThumbsDown className="h-3.5 w-3.5 mr-1.5" />
                Incorrect
              </Button>
            </div>
            {isCorrect === false && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-sm">
                <p className="font-medium mb-1 text-foreground text-xs">Expected correction:</p>
                <p className="text-muted-foreground text-sm">
                  {resultPrediction === "real" ? "Fake" : "Real"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rating (for non-correction feedback) */}
        {selectedType && selectedType !== "correction" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="text-xs font-medium text-muted-foreground">Rating (Optional)</label>
            <div className="flex gap-2 justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={cn(
                    "h-9 w-9 rounded-xl border transition-all duration-200",
                    "hover:border-primary/60 hover:bg-primary/5",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                    rating === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-card/50 text-muted-foreground"
                  )}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 mx-auto transition-all",
                      rating && rating >= value ? "fill-current" : ""
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {selectedType && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="text-xs font-medium text-muted-foreground">
              {selectedType === "correction" ? "Additional Comments (Optional)" : "Your Feedback"}
            </label>
            <Textarea
              placeholder={
                selectedType === "correction"
                  ? "Any additional details about the correction..."
                  : "Tell us more about your feedback..."
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[80px] text-sm"
            />
          </div>
        )}

        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl h-9 px-4 text-sm"
          >
            Cancel
          </Button>
          <ActionButton
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!isFormValid}
            loadingText="Submitting..."
            className="rounded-xl h-9 px-4 text-sm"
          >
            Submit Feedback
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

