"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToolbar } from "./toolbar-provider";
import { useEditorState } from "@tiptap/react";
import { MapPin } from "lucide-react";
import { useModal } from "@/lib/stores/modal-store";

export const MapboxToolbar = React.forwardRef<HTMLButtonElement>((_, ref) => {
  const { editor } = useToolbar();
  const { onOpen } = useModal();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isActive: ctx.editor.isActive("mapbox") ?? false,
      canMapbox: ctx.editor.can().chain().focus().run() ?? false,
    }),
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          ref={ref}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!editorState.canMapbox}
          onClick={() => onOpen("mapboxToolbar")}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Insert Map</p>
      </TooltipContent>
    </Tooltip>
  );
});

MapboxToolbar.displayName = "MapboxToolbar";
