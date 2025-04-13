"use client"

import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/core/store"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from 'lucide-react'
import { Modal } from "../global/modal"
import { closeModal } from "@/core/features/ui/modal-slice"

export default function SuccessOrFailureModal() {
  const dispatch = useDispatch()
  const { isOpen, type, data } = useSelector((state: RootState) => state.modal)
  
  const isModalOpen = isOpen && type === "SuccessOrFailure"
  const success = data.success === true
  const message = data.message || (success ? "Operation completed successfully!" : "Operation failed!")
  
  const onClose = () => {
    dispatch(closeModal())
  }
  
  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
    >
      <div className="flex flex-col items-center justify-center space-y-4 py-6">
        <div className={`rounded-full p-3 ${success ? "bg-green-50" : "bg-red-50"}`}>
          {success ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-medium">
            {success ? "Success!" : "Error!"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {message}
          </p>
        </div>
        
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    </Modal>
  )
}
