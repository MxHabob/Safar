"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToolbarContext } from "@/components/editor/toolbars/toolbar-provider";
import { useModal } from "@/lib/stores/modal-store";

export const YoutubeToolbarModal = () => {
  const toolbarContext = React.useContext(ToolbarContext);
  const editor = toolbarContext?.editor;
  const { isOpen, type, onOpen, onClose } = useModal();
  const isDialogOpen = isOpen && type === "youtubeToolbar";
  const [url, setUrl] = useState("");

  const addYoutubeVideo = () => {
    if (!editor) return;
    
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
      });
    }
    handleOpenChange(false);
    setUrl("");
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      onOpen("youtubeToolbar");
    } else {
      onClose();
      setUrl("");
    }
  };

  if (!isDialogOpen || !editor) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Youtube Video</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="youtube-url" className="text-right">
              URL
            </Label>
            <Input
              id="youtube-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="col-span-3"
              placeholder="https://www.youtube.com/watch?v=..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addYoutubeVideo();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={addYoutubeVideo}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

