"use client";

import Graphic from "@/components/shared/graphic";

export const RightSideNavbar = () => {
  return (
    <>
      <div>
      <button
        className="fixed top-3 right-3 z-40 bg-background rounded-bl-[18px]  cursor-pointer select-none"
      >
        <div className="relative pb-3 px-4">
          <Graphic className="absolute -bottom-4 right-0 rotate-90" />
          <Graphic className="absolute -left-4 top-0 rotate-90" />
        </div>
      </button>
      </div>
    </>
  );
};

