"use client";

/**
 * Text Editor Panel
 * Provides controls for editing text properties
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import type { TextEdit } from "@/lib/pdf-editor/types";

interface TextEditorPanelProps {
  textEdit: TextEdit | null;
  onUpdate: (edit: TextEdit) => void;
  onCancel: () => void;
}

export function TextEditorPanel({
  textEdit,
  onUpdate,
  onCancel,
}: TextEditorPanelProps) {
  const [edit, setEdit] = React.useState<TextEdit | null>(textEdit);

  React.useEffect(() => {
    setEdit(textEdit);
  }, [textEdit]);

  if (!edit) return null;

  const handleUpdate = () => {
    onUpdate({
      ...edit,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label>Text Content</Label>
        <Textarea
          value={edit.text}
          onChange={(e) => setEdit({ ...edit, text: e.target.value })}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Font Size</Label>
          <Input
            type="number"
            value={edit.fontSize}
            onChange={(e) =>
              setEdit({ ...edit, fontSize: Number(e.target.value) })
            }
            min={8}
            max={144}
          />
        </div>

        <div>
          <Label>Font Family</Label>
          <Select
            value={edit.fontFamily}
            onValueChange={(value) => setEdit({ ...edit, fontFamily: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Helvetica-Bold">Helvetica Bold</SelectItem>
              <SelectItem value="Helvetica-Oblique">Helvetica Italic</SelectItem>
              <SelectItem value="Times-Roman">Times Roman</SelectItem>
              <SelectItem value="Courier">Courier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Text Color</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={edit.color}
            onChange={(e) => setEdit({ ...edit, color: e.target.value })}
            className="w-16 h-10"
          />
          <Input
            type="text"
            value={edit.color}
            onChange={(e) => setEdit({ ...edit, color: e.target.value })}
            placeholder="#000000"
          />
        </div>
      </div>

      <div>
        <Label>Background Color (Optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={edit.backgroundColor || "#ffffff"}
            onChange={(e) =>
              setEdit({ ...edit, backgroundColor: e.target.value })
            }
            className="w-16 h-10"
          />
          <Input
            type="text"
            value={edit.backgroundColor || ""}
            onChange={(e) =>
              setEdit({ ...edit, backgroundColor: e.target.value || undefined })
            }
            placeholder="Transparent"
          />
        </div>
      </div>

      <div>
        <Label>Alignment</Label>
        <ToggleGroup
          type="single"
          value={edit.alignment}
          onValueChange={(value) => {
            if (value) {
              setEdit({
                ...edit,
                alignment: value as TextEdit["alignment"],
              });
            }
          }}
        >
          <ToggleGroupItem value="left" aria-label="Left align">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center align">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Right align">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Justify">
            <AlignJustify className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Line Height</Label>
          <Input
            type="number"
            value={edit.lineHeight}
            onChange={(e) =>
              setEdit({ ...edit, lineHeight: Number(e.target.value) })
            }
            min={0.5}
            max={3}
            step={0.1}
          />
        </div>

        <div>
          <Label>Letter Spacing</Label>
          <Input
            type="number"
            value={edit.letterSpacing}
            onChange={(e) =>
              setEdit({ ...edit, letterSpacing: Number(e.target.value) })
            }
            min={-2}
            max={10}
            step={0.1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Text Style</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={edit.bold}
              onCheckedChange={(checked) =>
                setEdit({ ...edit, bold: checked === true })
              }
            />
            <Label>Bold</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={edit.italic}
              onCheckedChange={(checked) =>
                setEdit({ ...edit, italic: checked === true })
              }
            />
            <Label>Italic</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={edit.underline}
              onCheckedChange={(checked) =>
                setEdit({ ...edit, underline: checked === true })
              }
            />
            <Label>Underline</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={edit.strikethrough}
              onCheckedChange={(checked) =>
                setEdit({ ...edit, strikethrough: checked === true })
              }
            />
            <Label>Strikethrough</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleUpdate} className="flex-1">
          Apply Changes
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

