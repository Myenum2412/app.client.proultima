/**
 * PDF Manipulator
 * Core utilities for manipulating PDF content using pdf-lib
 */

import { PDFDocument, rgb, PDFPage, PDFFont, PDFImage } from "pdf-lib";
import type {
  TextEdit,
  ImageEdit,
  FormField,
  DigitalSignature,
  PageOperation,
} from "./types";

export class PDFManipulator {
  private pdfDoc: Promise<PDFDocument>;
  private fonts: Map<string, PDFFont> = new Map();

  constructor(pdfBytes: Uint8Array | ArrayBuffer) {
    this.pdfDoc = PDFDocument.load(pdfBytes);
  }

  static async create(pdfBytes: Uint8Array | ArrayBuffer): Promise<PDFManipulator> {
    const manipulator = new PDFManipulator(pdfBytes);
    await manipulator.initialize();
    return manipulator;
  }

  private async initialize(): Promise<void> {
    const doc = await this.pdfDoc;
    // Preload standard fonts
    const helvetica = await doc.embedFont("Helvetica");
    const helveticaBold = await doc.embedFont("Helvetica-Bold");
    const helveticaOblique = await doc.embedFont("Helvetica-Oblique");
    
    this.fonts.set("Helvetica", helvetica);
    this.fonts.set("Helvetica-Bold", helveticaBold);
    this.fonts.set("Helvetica-Oblique", helveticaOblique);
  }

  async applyTextEdit(edit: TextEdit): Promise<void> {
    const doc = await this.pdfDoc;
    const pages = doc.getPages();
    if (edit.page < 1 || edit.page > pages.length) return;

    const page = pages[edit.page - 1];
    const { width, height } = page.getSize();

    // Get or embed font
    let font = this.fonts.get(edit.fontFamily);
    if (!font) {
      try {
        font = await doc.embedFont(edit.fontFamily as any);
        this.fonts.set(edit.fontFamily, font);
      } catch {
        font = this.fonts.get("Helvetica")!;
      }
    }

    // Apply bold/italic if needed
    if (edit.bold && edit.italic) {
      const boldItalic = this.fonts.get("Helvetica-BoldOblique");
      if (boldItalic) font = boldItalic;
    } else if (edit.bold) {
      const bold = this.fonts.get("Helvetica-Bold");
      if (bold) font = bold;
    } else if (edit.italic) {
      const italic = this.fonts.get("Helvetica-Oblique");
      if (italic) font = italic;
    }

    // Calculate text position (PDF coordinates start from bottom-left)
    const y = height - edit.y - edit.fontSize;

    // Draw background if specified
    if (edit.backgroundColor) {
      const bgColor = this.parseColor(edit.backgroundColor);
      const textWidth = font.widthOfTextAtSize(edit.text, edit.fontSize);
      page.drawRectangle({
        x: edit.x,
        y: y - edit.fontSize * 0.2,
        width: textWidth,
        height: edit.fontSize * 1.2,
        color: bgColor,
        opacity: 0.3,
      });
    }

    // Draw text
    const textColor = this.parseColor(edit.color);
    page.drawText(edit.text, {
      x: edit.x,
      y: y,
      size: edit.fontSize,
      font: font,
      color: textColor,
    });

    // Draw underline if needed
    if (edit.underline) {
      const textWidth = font.widthOfTextAtSize(edit.text, edit.fontSize);
      page.drawLine({
        start: { x: edit.x, y: y - 2 },
        end: { x: edit.x + textWidth, y: y - 2 },
        thickness: 1,
        color: textColor,
      });
    }

    // Draw strikethrough if needed
    if (edit.strikethrough) {
      const textWidth = font.widthOfTextAtSize(edit.text, edit.fontSize);
      page.drawLine({
        start: { x: edit.x, y: y + edit.fontSize * 0.5 },
        end: { x: edit.x + textWidth, y: y + edit.fontSize * 0.5 },
        thickness: 1,
        color: textColor,
      });
    }
  }

  async applyImageEdit(edit: ImageEdit): Promise<void> {
    const doc = await this.pdfDoc;
    const pages = doc.getPages();
    if (edit.page < 1 || edit.page > pages.length) return;

    const page = pages[edit.page - 1];

    // Load image
    let image: PDFImage;
    if (edit.src.startsWith("data:")) {
      const base64Data = edit.src.split(",")[1];
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      image = await doc.embedPng(imageBytes);
    } else {
      const response = await fetch(edit.src);
      const imageBytes = await response.arrayBuffer();
      image = await doc.embedPng(new Uint8Array(imageBytes));
    }

    const { width, height } = page.getSize();
    const y = height - edit.y - edit.height;

    page.drawImage(image, {
      x: edit.x,
      y: y,
      width: edit.width,
      height: edit.height,
      rotate: edit.rotation as any,
      opacity: edit.opacity,
    });
  }

  async applyFormField(field: FormField): Promise<void> {
    const doc = await this.pdfDoc;
    const pages = doc.getPages();
    if (field.page < 1 || field.page > pages.length) return;

    const page = pages[field.page - 1];
    const { width, height } = page.getSize();
    const y = height - field.y - field.height;

    // Draw form field background
    if (field.backgroundColor) {
      const bgColor = this.parseColor(field.backgroundColor);
      page.drawRectangle({
        x: field.x,
        y: y,
        width: field.width,
        height: field.height,
        color: bgColor,
        opacity: 0.1,
      });
    }

    // Draw border
    if (field.borderColor) {
      const borderColor = this.parseColor(field.borderColor);
      page.drawRectangle({
        x: field.x,
        y: y,
        width: field.width,
        height: field.height,
        borderColor: borderColor,
        borderWidth: 1,
      });
    }

    // Draw value
    if (field.value) {
      const font = this.fonts.get(field.fontFamily || "Helvetica") || this.fonts.get("Helvetica")!;
      const fontSize = field.fontSize || 12;
      const textColor = this.parseColor(field.color || "#000000");
      const valueText = Array.isArray(field.value) 
        ? field.value.join(", ") 
        : String(field.value);

      page.drawText(valueText, {
        x: field.x + 4,
        y: y + field.height / 2 - fontSize / 2,
        size: fontSize,
        font: font,
        color: textColor,
      });
    }
  }

  async applySignature(signature: DigitalSignature): Promise<void> {
    const doc = await this.pdfDoc;
    const pages = doc.getPages();
    if (signature.page < 1 || signature.page > pages.length) return;

    const page = pages[signature.page - 1];

    // Load signature image
    const base64Data = signature.image.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const image = await doc.embedPng(imageBytes);

    const { width, height } = page.getSize();
    const y = height - signature.y - signature.height;

    // Draw signature
    page.drawImage(image, {
      x: signature.x,
      y: y,
      width: signature.width,
      height: signature.height,
    });

    // Draw signature metadata
    const font = this.fonts.get("Helvetica")!;
    const metadataY = y - 15;
    page.drawText(
      `Signed by: ${signature.signerName} | ${new Date(signature.signedAt).toLocaleString()}`,
      {
        x: signature.x,
        y: metadataY,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
  }

  async applyPageOperation(operation: PageOperation): Promise<void> {
    const doc = await this.pdfDoc;
    const pages = doc.getPages();

    switch (operation.type) {
      case "delete":
        if (operation.pageNumber >= 1 && operation.pageNumber <= pages.length) {
          doc.removePage(operation.pageNumber - 1);
        }
        break;

      case "rotate":
        if (operation.pageNumber >= 1 && operation.pageNumber <= pages.length && operation.rotation) {
          const page = pages[operation.pageNumber - 1];
          page.setRotation(operation.rotation as any);
        }
        break;

      case "reorder":
        // Note: pdf-lib doesn't directly support reordering, would need to rebuild document
        // This is a placeholder for the concept
        break;

      case "insert":
        // Would need to load another PDF and insert pages
        break;

      case "duplicate":
        if (operation.pageNumber >= 1 && operation.pageNumber <= pages.length) {
          const [copiedPage] = await doc.copyPages(doc, [operation.pageNumber - 1]);
          doc.insertPage(operation.pageNumber, copiedPage);
        }
        break;
    }
  }

  async applyAnnotation(annotation: any): Promise<void> {
    const doc = await this.pdfDoc;
    const pages = doc.getPages();
    if (annotation.page < 1 || annotation.page > pages.length) return;

    const page = pages[annotation.page - 1];
    const { width, height } = page.getSize();

    switch (annotation.type) {
      case "highlight":
        if ("width" in annotation && "height" in annotation) {
          page.drawRectangle({
            x: annotation.x,
            y: height - annotation.y - annotation.height,
            width: annotation.width,
            height: annotation.height,
            color: rgb(1, 1, 0),
            opacity: 0.3,
          });
        }
        break;

      case "strikethrough":
        if ("width" in annotation) {
          page.drawLine({
            start: { x: annotation.x, y: height - annotation.y },
            end: { x: annotation.x + annotation.width, y: height - annotation.y },
            thickness: 2,
            color: rgb(1, 0, 0),
          });
        }
        break;

      // Add more annotation types as needed
    }
  }

  async save(): Promise<Uint8Array> {
    const doc = await this.pdfDoc;
    return await doc.save();
  }

  private parseColor(color: string): ReturnType<typeof rgb> {
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
    return rgb(0, 0, 0);
  }
}

