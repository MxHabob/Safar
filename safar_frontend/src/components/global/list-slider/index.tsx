"use client";

import Link from "next/link";
import "swiper/css/bundle";
import { SwiperProps, SwiperSlide } from "swiper/react";
import { Slider } from "../slider";
import { ListItem } from "./list-item";
import { Category } from "@/core/types";

type Props = {
  items: Category[];
  overlay?: boolean;
  isLoading?: boolean;
  selected?: string;
  route?: boolean;
} & SwiperProps;

export const ListSlider = ({ items, overlay, isLoading ,selected, route, ...rest }: Props) => {
  return (
    <Slider slidesPerView="auto" spaceBetween={10} isLoading={isLoading} loop freeMode overlay={overlay} {...rest}>
        {items.map((item) => (
          <SwiperSlide key={item.id} className="content-width-slide">
            {route ? (
              <Link href={`/?${item.name}`}>
                <ListItem name={item.name} selected={selected} />
              </Link>
            ) : (
              <ListItem name={item.name} />
            )}
          </SwiperSlide>
        ))}
    </Slider>
  );
};
