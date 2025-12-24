import { Search } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopHeader({
  section,
  page,
  search,
}: {
  section?: string;
  page: string;
  search?: { placeholder: string; action?: string; name?: string };
}) {
  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 w-full">
     <div className="flex items-center justify-between gap-2 px-4 w-full">
     <div className="flex items-center  gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {section ? (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">{section}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            ) : null}
            <BreadcrumbItem>
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {search ? (
        <form
          role="search"
          action={search.action ?? "#"}
          method="get"
          className="absolute left-1/2 -translate-x-1/2 w-[min(520px,calc(100%-2rem))] hidden md:block"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              name={search.name ?? "q"}
              type="search"
              placeholder={search.placeholder}
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </form>
      ) : null}
     </div>
    </header>
  );
}
