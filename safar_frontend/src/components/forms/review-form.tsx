// "use client"

// import { useState } from "react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { Button } from "@/components/ui/button"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { Textarea } from "@/components/ui/textarea"
// import { Rating } from "@/components/ui/rating"
// import { toast } from "@/components/ui/use-toast"
// import { useCreateReviewOptimisticMutation } from "@/core/services/optimistic-api"

// const reviewSchema = z.object({
//   rating: z.number().min(1, "Rating is required").max(5),
//   content: z.string().min(10, "Review must be at least 10 characters"),
// })

// type ReviewFormValues = z.infer<typeof reviewSchema>

// interface ReviewFormProps {
//   entityId: string
//   entityType: "place" | "experience" | "box"
//   onSuccess?: () => void
// }

// export default function ReviewForm({ entityId, entityType, onSuccess }: ReviewFormProps) {
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [createReview] = useCreateReviewOptimisticMutation()

//   const form = useForm<ReviewFormValues>({
//     resolver: zodResolver(reviewSchema),
//     defaultValues: {
//       rating: 0,
//       content: "",
//     },
//   })

//   const onSubmit = async (data: ReviewFormValues) => {
//     setIsSubmitting(true)

//     try {
//       await createReview({
//         content_type: entityType,
//         object_id: entityId,
//         rating: data.rating,
//         content: data.content,
//       }).unwrap()

//       toast({
//         title: "Review submitted",
//         description: "Your review has been submitted successfully",
//         variant: "default",
//       })

//       form.reset()
//       if (onSuccess) onSuccess()
//     } catch (error) {
//       toast({
//         title: "Submission failed",
//         description: "There was a problem submitting your review",
//         variant: "destructive",
//       })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         <FormField
//           control={form.control}
//           name="rating"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Rating</FormLabel>
//               <FormControl>
//                 <Rating value={field.value} onChange={field.onChange} max={5} size="lg" />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormField
//           control={form.control}
//           name="content"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Your Review</FormLabel>
//               <FormControl>
//                 <Textarea placeholder="Share your experience..." className="min-h-[120px]" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <Button type="submit" disabled={isSubmitting} className="w-full">
//           {isSubmitting ? "Submitting..." : "Submit Review"}
//         </Button>
//       </form>
//     </Form>
//   )
// }
