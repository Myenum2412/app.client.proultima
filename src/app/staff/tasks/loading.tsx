import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TasksLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[120px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Task Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <Skeleton className="h-5 w-[150px]" />
                <Skeleton className="h-6 w-[60px] rounded-full" />
              </div>
              <Skeleton className="h-4 w-[200px] mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-[70px]" />
                <Skeleton className="h-8 w-[80px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

