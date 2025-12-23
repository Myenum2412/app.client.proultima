# Drawing Log PDF Viewer with Annotation System

## Overview

This implementation integrates the kokonutui/toolbar component into the Drawing Log PDF Viewer, enabling inline PDF editing capabilities for drawing corrections. Users can annotate, highlight, strike through, and add correction notes directly within the PDF.

## Features

### 1. Enhanced PDF Viewer (`components/projects/drawing-pdf-viewer-enhanced.tsx`)

- **Kokonutui Toolbar Integration**: Full toolbar with select, move, shapes, layers, frame, properties, export, share, notifications, profile, and appearance tools
- **Annotation Tools**:
  - **Highlight**: Yellow highlight annotations for marking important sections
  - **Strike Through**: Red strikethrough lines for indicating corrections
  - **Notes**: Blue note markers with text for detailed correction comments
- **Version Control**: Undo/Redo functionality with full history tracking
- **PDF Manipulation**: Uses `pdf-lib` to embed annotations directly into PDF files
- **Canvas Overlay**: Real-time annotation rendering on canvas overlay above PDF iframe

### 2. Annotation Capabilities

- **Highlight**: Click and drag to create yellow highlight rectangles
- **Strike Through**: Click and drag to create red strikethrough lines
- **Notes**: Click to add a note marker, then enter correction text in dialog
- **Delete**: Select and delete individual annotations
- **Undo/Redo**: Full history support for annotation operations

### 3. Version Tracking & Persistence

- **Annotation History**: All annotations are tracked with:
  - Unique ID
  - Type (highlight/strikethrough/note)
  - Position (x, y coordinates)
  - Page number
  - Color
  - Text (for notes)
  - Created timestamp
  - Creator information

- **PDF Versioning**: Each saved correction creates a new PDF version with:
  - Revision number (auto-incremented)
  - Revision status (default: "REVISION")
  - Corrected date
  - Editor ID and name
  - Annotated PDF stored in Supabase Storage

### 4. API Endpoints

#### POST `/api/drawings/[drawingId]/annotations`

Saves annotations and updates Drawing Log:

**Request:**
- FormData with:
  - `annotations`: JSON string of annotation array
  - `pdfBlob`: File blob of annotated PDF
  - `revisionNumber`: Revision number (string)
  - `revisionStatus`: Revision status (string)

**Response:**
```json
{
  "success": true,
  "message": "Drawing corrections saved successfully",
  "pdfUrl": "https://...",
  "revisionNumber": 1
}
```

**Actions:**
1. Uploads annotated PDF to Supabase Storage bucket `drawings`
2. Saves annotation metadata to `drawing_annotations` table
3. Updates `drawings` table with:
   - `revision_status`
   - `revision_number`
   - `corrected_date`
   - `editor_id`
   - `editor_name`
   - `pdf_path` (new annotated PDF URL)

#### GET `/api/drawings/[drawingId]/annotations`

Retrieves latest annotations for a drawing:

**Response:**
```json
{
  "annotations": [...],
  "pdfUrl": "https://...",
  "revisionNumber": 1
}
```

### 5. Database Schema

#### `drawing_annotations` Table

```sql
CREATE TABLE drawing_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES drawings(id),
  annotations JSONB NOT NULL,
  pdf_url TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  revision_status TEXT NOT NULL,
  corrected_date TIMESTAMPTZ NOT NULL,
  editor_id UUID REFERENCES auth.users(id),
  editor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `drawings` Table Updates

Additional columns for revision tracking:
- `revision_status` TEXT
- `revision_number` INTEGER
- `corrected_date` TIMESTAMPTZ
- `editor_id` UUID
- `editor_name` TEXT
- `pdf_path` TEXT (updated with new annotated PDF URL)

### 6. Integration

The enhanced viewer is integrated into `components/projects/project-sections.tsx`:

- Replaces `DrawingPdfDialog` with `DrawingPdfViewerEnhanced`
- Passes drawing ID and DWG number for tracking
- Handles save callback to persist annotations
- Automatically updates Drawing Log table when corrections are saved

## Usage

1. **Open Drawing**: Click on any row in the "Drawing Log" table
2. **Enable Editing**: Click the lock/unlock toggle in the toolbar (or use annotation buttons)
3. **Add Annotations**:
   - Click "Highlight" button, then click and drag on PDF
   - Click "Strike Through" button, then click and drag on PDF
   - Click "Add Note" button, click on PDF, enter note text
4. **Manage Annotations**:
   - Use Undo/Redo buttons to manage history
   - Select annotation and click Delete to remove
5. **Save Corrections**: Click "Save Corrections" button
   - Annotations are embedded into PDF
   - PDF is uploaded to storage
   - Drawing Log is updated with revision info
   - Success notification is shown

## Technical Stack

- **PDF.js**: For PDF rendering and page management
- **pdf-lib**: For PDF manipulation and annotation embedding
- **Kokonutui Toolbar**: UI component for tool selection
- **Canvas API**: For real-time annotation overlay rendering
- **Supabase Storage**: For PDF file storage
- **Supabase Database**: For annotation metadata and Drawing Log updates

## Future Enhancements

- [ ] Multi-page annotation support with page navigation
- [ ] Annotation color picker
- [ ] Annotation text editing
- [ ] Annotation export/import
- [ ] Collaborative annotations (real-time)
- [ ] Annotation comments and replies
- [ ] PDF comparison view (original vs annotated)
- [ ] Annotation templates
- [ ] Batch annotation operations

