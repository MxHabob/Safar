"use client";

import Link from "next/link";
import "swiper/css/bundle";
import { SwiperProps, SwiperSlide } from "swiper/react";
import { Slider } from "../slider";
import { ListItem } from "./list-item";
import InfiniteScrollObserver from "../infinite-scroll-observer";
import { JSX } from "react";

type ItemProps = {
  id: string | number;
  label: string;
  icon: JSX.Element;
  path: string;
};

type Props = {
  items: ItemProps[];
  overlay?: boolean;
  label?: string;
  selected?: string;
  route?: boolean;
} & SwiperProps;

export const ListSlider = ({ items, overlay, label, selected, route, ...rest }: Props) => {
  return (
    <Slider slidesPerView={"auto"} spaceBetween={10} loop freeMode label={label} overlay={overlay} {...rest}>
      <InfiniteScrollObserver>
        {items.map((item) => (
          <SwiperSlide key={item.id} className="content-width-slide">
            {route ? (
              <Link href={`/?${item.name}`}>
                <ListItem {...item} selected={selected} />
              </Link>
            ) : (
              <ListItem {...item} />
            )}
          </SwiperSlide>
        ))}
      </InfiniteScrollObserver>
    </Slider>
  );
};
