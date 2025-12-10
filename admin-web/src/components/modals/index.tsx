"use client"

import { AdminEditUserModal } from "./admin-edit-user-modal"
import { AdminConfirmUserActionModal } from "./admin-confirm-user-action-modal"
import { AdminEditListingModal } from "./admin-edit-listing-modal"
import { AdminConfirmListingActionModal } from "./admin-confirm-listing-action-modal"
import { AdminConfirmBookingActionModal } from "./admin-confirm-booking-action-modal"
import { AdminConfirmPaymentActionModal } from "./admin-confirm-payment-action-modal"
import { MfaSetupModal } from "./mfa-setup-modal"
import { MfaVerifyModal } from "./mfa-verify-modal"
import { EnableMfaConfirmModal } from "./enable-mfa-confirm-modal"
// Note: Some modals may not exist yet - uncomment when available
// import { DeleteAccountConfirmModal } from "./delete-account-confirm-modal"
import { SignOutConfirmModal } from "./sign-out-confirm-modal"
import { SetPasswordModal } from "./set-password-modal"
import { LanguagePickerModal } from "./language-picker-modal"
// import { AnalysisFeedbackModal } from "./analysis-feedback-modal"

export function ModalsProvider() {
  return (
    <>
      {/* Admin Modals */}
      <AdminEditUserModal />
      <AdminConfirmUserActionModal />
      <AdminEditListingModal />
      <AdminConfirmListingActionModal />
      <AdminConfirmBookingActionModal />
      <AdminConfirmPaymentActionModal />
      
      {/* Auth & Security Modals */}
      <MfaSetupModal />
      <MfaVerifyModal />
      <EnableMfaConfirmModal />
      {/* <DeleteAccountConfirmModal /> */} {/* Uncomment when file exists */}
      <SignOutConfirmModal />
      <SetPasswordModal />
      
      {/* Utility Modals */}
      <LanguagePickerModal />
      {/* <AnalysisFeedbackModal /> */} {/* Uncomment when file exists */}
    </>
  )
}

