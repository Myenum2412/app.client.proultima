"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isPdfOpen, setIsPdfOpen] = useState(false)
  const [isBillingOpen, setIsBillingOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const brochureTitle = "Company Brochure"
  const brochureDescription = "View the Proultima company brochure."
  const brochurePdfUrl = "/assets/compan-brochure.pdf"

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        // Clear any client-side state if needed
        // Redirect to login page
        router.push("/login")
        router.refresh()
      } else {
        console.error("Logout failed")
        alert("Failed to log out. Please try again.")
      }
    } catch (error) {
      console.error("Logout error:", error)
      alert("An error occurred during logout. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setIsPdfOpen(true)}
                >
                  <Sparkles />
                  Company Brochure
                </DropdownMenuItem>
              </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setIsBillingOpen(true)}
              >
                <CreditCard />
                Account Information
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>

    <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
    <DialogContent className="max-w-7xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>{brochureTitle}</DialogTitle>
          <DialogDescription>{brochureDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <iframe
            src={brochurePdfUrl}
            className="w-full h-full border rounded-md"
            title={brochureTitle}
          />
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={isBillingOpen} onOpenChange={setIsBillingOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Bank Account Information
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Bank Name</span>
              <span className="text-base">State Bank of India</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Account Name</span>
              <span className="text-base">M/s. Proultima Engineering Solutions Private Limited</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Account Type</span>
              <span className="text-base">EEFC Account (USD Currency)</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Account Number</span>
              <span className="text-base font-mono">44563103735</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">SWIFT Code</span>
              <span className="text-base font-mono">SBININBB300</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">IFSC Code</span>
              <span className="text-base font-mono">SBIN0005739</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Branch Name</span>
              <span className="text-base">SBI – Salem Steel Plant Campus Branch</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Branch Address</span>
              <span className="text-base">Near Gate No. 2, Salem Steel Plant Campus, Salem – 636030, Tamil Nadu, India</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
