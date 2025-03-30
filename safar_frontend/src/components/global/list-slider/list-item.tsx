"use client";

import { cn } from "@/lib/utils";
import { JSX } from "react";

type GroupListItemProps = {
  icon?: JSX.Element;
  name?: string;
  selected?: string;
};

export const ListItem = ({ icon, name, selected }: GroupListItemProps) => {
  return (
    <div
      className={cn(
        "flex gap-3 items-center py-2 px-4 rounded-2xl bg-background border-2 cursor-pointer transition-colors",
        selected === name ? "bg-accent-foreground" : "border"
      )}
    >
      {icon && icon}
      {name}
    </div>
  );
};
