"use client";

import Link from "next/link";
import "swiper/css/bundle";
import { SwiperProps, SwiperSlide } from "swiper/react";
import { Slider } from "../slider";
import ExperienceCard from "./experience-card";
import { useGetExperiencesQuery } from "@/redux/services/api";

type Props = {
  overlay?: boolean;
  selected?: string;
} & SwiperProps;

export const ListExperience = ({ overlay, ...rest }: Props) => {
  const { data:experiences } = useGetExperiencesQuery({});

  console.log("experiences", experiences);
  return (
    <Slider slidesPerView="auto" spaceBetween={10} loop freeMode overlay={overlay} {...rest}>
        {experiences?.results.map((experience) => (
          <SwiperSlide key={experience.id} className="content-width-slide">
              <Link href={`/?${experience.id}`}>
                <ExperienceCard experience={experience || []}  />
              </Link>
  
          </SwiperSlide>
        ))}
    </Slider>
  );
};
