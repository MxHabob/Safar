"use client";

import { CreatePhotoModal } from "./create-photo-modal";
import { CreateCouponDialog } from "./create-coupon-dialog";
import { RedeemPointsDialog } from "./redeem-points-dialog";
import { ConfirmModal } from "./confirm-modal";
import { MapboxToolbarModal } from "./mapbox-toolbar-modal";
import { YoutubeToolbarModal } from "./youtube-toolbar-modal";

export const Modals = () => {
  return (
    <>
      <CreatePhotoModal />
      <CreateCouponDialog />
      <RedeemPointsDialog />
      <ConfirmModal />
      <MapboxToolbarModal />
      <YoutubeToolbarModal />
    </>
  );
};

