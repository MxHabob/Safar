import { Editor } from "@tiptap/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const NODE_HANDLES_SELECTED_STYLE_CLASSNAME =
  "node-handles-selected-style";

export function isValidUrl(url: string) {
  return /^https?:\/\/\S+$/.test(url);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const duplicateContent = (editor: Editor) => {
  const { view } = editor;
  const { state } = view;
  const { selection } = state;

  editor
    .chain()
    .insertContentAt(
      selection.to,
      selection.content().content.firstChild?.toJSON(),
      {
        updateSelection: true,
      }
    )
    .focus(selection.to)
    .run();
};

// Export date utilities
export * from "./date";

// Export currency utilities
export * from "./currency";

// Export performance utilities
export * from "./performance";

