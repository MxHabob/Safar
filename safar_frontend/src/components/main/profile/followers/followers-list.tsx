"use client";

import { SwiperSlide } from "swiper/react";
import { Slider } from "@/components/global/slider";
import { useGetUserFollowersQuery } from "@/core/services/api";
import { User } from "@/core/types";
import { FollowerCard } from "./follower-card";

type Props = {
  userId: string;
  overlay?: boolean;
  selected?: string;
};

export const ListFollowers = ({ userId, overlay, selected }: Props) => {
  const { data, isLoading, error } = useGetUserFollowersQuery(userId);

  if (error) {
    return (
      <div className="flex justify-center items-center py-8 text-red-500">
        <p>Error loading followers. Please try again later.</p>
      </div>
    );
  }

  return (
    <Slider
      slidesPerView="auto"
      spaceBetween={16}
      loop={(data?.count ?? 0) > 3}
      freeMode
      overlay={overlay}
    >
      {(data?.count ?? 0) > 0 ? (
        data?.results.map((follower: User) => (
          <SwiperSlide
            key={follower.id}
            className={`content-width-slide transition-all duration-200 ${
              selected === follower.id ? "scale-[1.02]" : ""
            }`}
          >
            <FollowerCard follower={follower} />
          </SwiperSlide>
        ))
      ) : !isLoading ? (
        <div className="flex justify-center items-center p-8 text-gray-500 col-span-full">
          <p>No followers found.</p>
        </div>
      ) : null}

      {isLoading && (
        <>
          {[1, 2, 3, 4, 5].map((i) => (
            <SwiperSlide key={i} className="content-width-slide">
              <FollowerCard.Skeleton />
            </SwiperSlide>
          ))}
        </>
      )}
    </Slider>
  );
};
