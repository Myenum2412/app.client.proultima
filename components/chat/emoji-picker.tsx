"use client";

import * as React from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_CATEGORIES = {
  "Smileys & People": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓"],
  "Gestures": ["🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"],
  "Objects": ["⌚", "📱", "📲", "💻", "⌨️", "🖥", "🖨", "🖱", "🖲", "🕹", "🗜", "💾", "💿", "📷", "📸", "📹", "🎥", "📽", "🎞", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙", "🎚", "🎛", "⏱", "⏲", "⏰", "🕰", "⌛", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯", "🧯", "🛢", "💸", "💵", "💴", "💶", "💷", "💰", "💳", "💎"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️"],
};

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void;
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="max-h-64 overflow-y-auto">
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} className="mb-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                {category}
              </div>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onEmojiSelect(emoji);
                      setOpen(false);
                    }}
                    className="text-xl hover:bg-accent rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

