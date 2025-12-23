# PDF Editing Toolbar Implementation

## Overview

A comprehensive PDF editing toolbar integrated with the Drawing Log PDF Viewer, providing extensive markup and annotation capabilities for drawing review and correction workflows.

## Features

### Core Tools

1. **Text Markup Tools**
   - **Highlight**: Yellow highlight rectangles for marking important sections
   - **Underline**: Blue underline annotations
   - **Strikethrough**: Red strikethrough lines for corrections
   - Keyboard shortcuts: `H`, `U`, `S`

2. **Drawing Tools**
   - **Pen Tool**: Freehand drawing with adjustable color and stroke width
   - **Rectangle**: Draw rectangles for area marking
   - **Circle**: Draw circles for area marking
   - **Arrow**: Draw arrows for pointing to specific areas
   - Keyboard shortcuts: `P`, `R`, `C`, `A`

3. **Annotation Tools**
   - **Text**: Add text comments directly on PDF
   - **Stamp**: Approval markers (Approved, Revise, Rejected, Reviewed, Draft)
   - **Note**: Anchored notes with title and description
   - Keyboard shortcuts: `T`, `D`

4. **Editing Tools**
   - **Select**: Select and manipulate annotations
   - **Move**: Move selected annotations
   - **Eraser**: Delete annotations
   - **Undo/Redo**: Full history support (Ctrl+Z, Ctrl+Shift+Z)
   - Keyboard shortcuts: `V`, `M`, `E`

5. **View Controls**
   - **Zoom In/Out**: Adjust PDF zoom level
   - **Reset Zoom**: Return to 100% zoom
   - Page navigation for multi-page PDFs

### Advanced Features

1. **Layer Management**
   - Create multiple annotation layers
   - Toggle layer visibility
   - Lock/unlock layers
   - Link layers to revision numbers
   - Color-code layers

2. **Revision Tagging**
   - Link annotations to specific revision numbers
   - View annotations by revision
   - Track revision history

3. **Autosave**
   - Automatic saving with 2-second debounce
   - Visual status indicators (Saved, Saving, Unsaved)
   - Manual save option (Ctrl+S)
   - Prevents data loss

4. **Version History**
   - Track all annotation versions
   - View previous revisions
   - Restore previous versions
   - Maximum 50 versions stored

5. **Role-Based Access Control**
   - View-only mode for restricted users
   - Edit permissions control
   - Layer creation permissions
   - Revision management permissions

6. **Keyboard Shortcuts**
   - `V` - Select tool
   - `M` - Move tool
   - `H` - Highlight
   - `U` - Underline
   - `S` - Strikethrough
   - `P` - Pen tool
   - `R` - Rectangle
   - `C` - Circle
   - `A` - Arrow
   - `T` - Text
   - `D` - Stamp
   - `E` - Eraser
   - `Ctrl+Z` - Undo
   - `Ctrl+Shift+Z` - Redo
   - `Ctrl+S` - Save

## Architecture

### Components

1. **PDFToolbar** (`components/kokonutui/pdf-toolbar.tsx`)
   - Main toolbar component
   - Tool selection and settings
   - Layer and revision management
   - Zoom controls
   - Autosave status display

2. **DrawingPdfViewerAdvanced** (`components/projects/drawing-pdf-viewer-advanced.tsx`)
   - Enhanced PDF viewer
   - Canvas-based annotation rendering
   - Tool interaction handling
   - Version history management

### Libraries

1. **Type Definitions** (`lib/pdf-annotations/types.ts`)
   - Comprehensive annotation type definitions
   - Layer and version types
   - User permissions interface

2. **Autosave Manager** (`lib/pdf-annotations/autosave.ts`)
   - Debounced autosave functionality
   - Status tracking
   - Error handling

3. **Version History Manager** (`lib/pdf-annotations/version-history.ts`)
   - Version creation and storage
   - Version restoration
   - History management

## Usage

### Basic Integration

```tsx
import { DrawingPdfViewerAdvanced } from "@/components/projects/drawing-pdf-viewer-advanced";

<DrawingPdfViewerAdvanced
  open={isOpen}
  onOpenChange={setIsOpen}
  pdfUrl="/path/to/drawing.pdf"
  title="Drawing R-71"
  description="Foundation Panels"
  drawingId="drawing-123"
  dwgNo="R-71"
  onSave={async (annotations, pdfBlob) => {
    // Save annotations and PDF
  }}
  userPermissions={{
    canEdit: true,
    canDelete: true,
    canCreateLayers: true,
    canManageRevisions: true,
    isViewOnly: false,
  }}
  currentRevisionNumber={1}
  availableRevisions={[1, 2, 3]}
/>
```

### Tool Selection

```tsx
// Tool modes available
type ToolMode =
  | "select"
  | "move"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "pen"
  | "rectangle"
  | "circle"
  | "arrow"
  | "text"
  | "stamp"
  | "eraser";
```

### Layer Management

```tsx
// Create a new layer
onLayerCreate={(name, revisionNumber) => {
  const newLayer: Layer = {
    id: `layer-${Date.now()}`,
    name,
    visible: true,
    locked: false,
    revisionNumber,
    createdAt: new Date().toISOString(),
    createdBy: userId,
  };
  // Add to layers array
}}
```

### Annotation Types

All annotations support:
- `id`: Unique identifier
- `type`: Annotation type
- `page`: Page number
- `layerId`: Associated layer
- `revisionNumber`: Revision number
- `title`: Optional title
- `description`: Optional description
- `createdAt`: Creation timestamp
- `createdBy`: Creator ID
- `updatedAt`: Update timestamp (if modified)
- `updatedBy`: Updater ID (if modified)

## API Integration

### Save Annotations

```typescript
POST /api/drawings/[drawingId]/annotations

Body (FormData):
- annotations: JSON string of Annotation[]
- pdfBlob: File blob of annotated PDF
- revisionNumber: string
- revisionStatus: string
- layers: JSON string of Layer[] (optional)
```

### Get Annotations

```typescript
GET /api/drawings/[drawingId]/annotations

Response:
{
  annotations: Annotation[],
  layers: Layer[],
  pdfUrl: string,
  revisionNumber: number,
  versionHistory: AnnotationVersion[]
}
```

## Performance Optimizations

1. **Canvas Rendering**
   - Only render annotations for current page
   - Filter by visible layers
   - Debounced canvas updates

2. **Annotation Storage**
   - Non-destructive (original PDF preserved)
   - Annotations stored separately
   - Efficient serialization

3. **Large PDF Support**
   - Lazy loading of pages
   - Virtual scrolling for annotations
   - Optimized canvas rendering

4. **Memory Management**
   - Limited version history (50 versions)
   - Cleanup of unused annotations
   - Efficient data structures

## Security

1. **Role-Based Access**
   - View-only mode enforcement
   - Edit permission checks
   - Layer creation restrictions

2. **Data Validation**
   - Annotation type validation
   - Coordinate bounds checking
   - Page number validation

3. **Storage Security**
   - User-scoped annotations
   - RLS policies in Supabase
   - Secure file uploads

## Future Enhancements

- [ ] Collaborative annotations (real-time)
- [ ] Annotation comments and replies
- [ ] PDF comparison view
- [ ] Annotation templates
- [ ] Batch operations
- [ ] Export annotations as separate layer
- [ ] Print annotations
- [ ] Mobile touch support
- [ ] Multi-page selection
- [ ] Annotation search

## Troubleshooting

### Canvas Not Rendering
- Check if canvas ref is properly attached
- Verify iframe dimensions match canvas
- Ensure annotations are filtered by current page

### Autosave Not Working
- Check autosave manager initialization
- Verify onSave callback is provided
- Check network connectivity

### Performance Issues
- Reduce number of annotations per page
- Limit version history size
- Optimize canvas rendering frequency

## License

MIT

