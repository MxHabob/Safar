"use client";

import { Youtube } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToolbar } from "./toolbar-provider";
import { useEditorState } from "@tiptap/react";
import { useModal } from "@/lib/stores/modal-store";

const YoutubeToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const { onOpen } = useModal();

    const editorState = useEditorState({
      editor,
      selector: (ctx) => ({
        isYoutubeActive: ctx.editor.isActive("youtube") ?? false,
      }),
    });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            editorState.isYoutubeActive && "bg-accent",
            className
          )}
          onClick={(e) => {
            onOpen("youtubeToolbar");
            onClick?.(e);
          }}
          ref={ref}
          {...props}
        >
          {children || <Youtube className="h-4 w-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span>Youtube</span>
      </TooltipContent>
    </Tooltip>
  );
  }
);

YoutubeToolbar.displayName = "YoutubeToolbar";

export { YoutubeToolbar };
