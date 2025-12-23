# Pagination and Infinite Queries Implementation

This document outlines the comprehensive pagination and infinite query implementation across the codebase.

## Overview

The codebase now supports two types of pagination:
1. **Page-based Pagination**: Traditional pagination with page numbers (for tables)
2. **Infinite Queries**: Cursor-based infinite scrolling (for chat messages and lists)

## Implementation Details

### 1. Pagination Utilities

**Location**: `lib/api/pagination.ts`

- `parsePaginationParams()`: Parses `page` and `pageSize` from URL search params
- `createPaginatedResponse()`: Creates paginated response with metadata
- `createInfiniteResponse()`: Creates infinite query response with cursor

### 2. API Endpoints Updated

All major endpoints now support pagination:

- `/api/billing/invoices` - Paginated invoices
- `/api/drawings` - Paginated drawings
- `/api/submissions` - Paginated submissions
- `/api/projects/[projectId]/sections` - Paginated project sections
- `/api/chat/messages` - Infinite query for chat messages

### 3. React Hooks

**Location**: `lib/hooks/use-api.ts`

#### Page-based Pagination

```typescript
const { data, page, setPage, pageSize, setPageSize, pagination } = useBillingInvoices({
  page: 1,
  pageSize: 20,
});
```

#### Infinite Queries

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useChatMessages(projectId);
```

### 4. UI Components

#### PaginationControls

**Location**: `components/ui/pagination-controls.tsx`

Reusable pagination controls with:
- Page navigation (First, Previous, Next, Last)
- Page size selector
- Total records display
- Current page indicator

#### InfiniteScrollTrigger

**Location**: `components/ui/infinite-scroll-trigger.tsx`

Automatic infinite scroll trigger using Intersection Observer:
- Loads more when scrolling near bottom
- Shows loading state
- Handles end of list

### 5. Updated Components

#### Billing Invoices Table

- Uses `useBillingInvoices` with pagination
- Server-side pagination with controls
- Maintains page state

#### Submissions Table

- Uses `useSubmissions` with pagination
- Server-side pagination

#### Chat Interface

- Uses `useChatMessages` with infinite queries
- Automatic loading on scroll
- Flattens pages for display

#### Project Sections

- All sections support pagination
- Data extracted from paginated responses

## Usage Examples

### Page-based Pagination

```typescript
function MyTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, pagination } = useBillingInvoices({ page, pageSize });

  return (
    <>
      <Table data={data?.data ?? []} />
      {pagination && (
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      )}
    </>
  );
}
```

### Infinite Queries

```typescript
function ChatMessages() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(projectId);

  const allMessages = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <ScrollArea>
      {allMessages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      <InfiniteScrollTrigger
        onLoadMore={() => fetchNextPage()}
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
      />
    </ScrollArea>
  );
}
```

## Response Formats

### Paginated Response

```typescript
{
  data: T[],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean,
  }
}
```

### Infinite Query Response

```typescript
{
  data: T[],
  nextCursor: string | number | null,
  hasMore: boolean,
}
```

## Performance Benefits

1. **Reduced Initial Load**: Only loads first page of data
2. **Faster Rendering**: Smaller datasets render faster
3. **Lower Memory Usage**: Only keeps current page in memory
4. **Better Network Efficiency**: Smaller payloads per request
5. **Improved UX**: Progressive loading feels faster

## Best Practices

1. **Default Page Size**: Use 20 items per page for tables
2. **Infinite Scroll**: Use for chat, feeds, and long lists
3. **Page-based**: Use for tables with sorting/filtering
4. **Cache Management**: TanStack Query automatically caches pages
5. **Loading States**: Always show loading indicators
6. **Error Handling**: Handle pagination errors gracefully

## Migration Guide

### Before (No Pagination)

```typescript
const { data } = useBillingInvoices();
// Returns all invoices at once
```

### After (With Pagination)

```typescript
const [page, setPage] = useState(1);
const { data } = useBillingInvoices({ page, pageSize: 20 });
// Returns paginated response with metadata
```

## Future Enhancements

- [ ] Virtual scrolling for very large lists
- [ ] Prefetching next page on hover
- [ ] URL-based pagination state
- [ ] Server-side sorting and filtering
- [ ] Optimistic pagination updates

