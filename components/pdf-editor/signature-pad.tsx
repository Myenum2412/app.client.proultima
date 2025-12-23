"use client";

/**
 * Signature Pad Component
 * Allows users to draw digital signatures
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Check } from "lucide-react";
import type { DigitalSignature } from "@/lib/pdf-editor/types";

interface SignaturePadProps {
  onSave: (signature: Omit<DigitalSignature, "id" | "page" | "x" | "y" | "width" | "height" | "signedAt" | "verified">) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [signerName, setSignerName] = React.useState("");
  const [signerEmail, setSignerEmail] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [location, setLocation] = React.useState("");

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 200;

    // Set drawing style
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL("image/png");

    if (!signerName || !signerEmail) {
      alert("Please enter signer name and email");
      return;
    }

    onSave({
      image,
      signerName,
      signerEmail,
      reason: reason || undefined,
      location: location || undefined,
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <Label>Draw Your Signature</Label>
        <div className="border rounded-lg p-4 bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full cursor-crosshair border rounded"
            style={{ touchAction: "none" }}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearSignature}
          className="mt-2"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      <div>
        <Label>Signer Name *</Label>
        <Input
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="John Doe"
          required
        />
      </div>

      <div>
        <Label>Signer Email *</Label>
        <Input
          type="email"
          value={signerEmail}
          onChange={(e) => setSignerEmail(e.target.value)}
          placeholder="john@example.com"
          required
        />
      </div>

      <div>
        <Label>Reason (Optional)</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="I am approving this document"
        />
      </div>

      <div>
        <Label>Location (Optional)</Label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="New York, USA"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Save Signature
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

