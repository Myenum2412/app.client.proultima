import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/admin/settings/profile-settings";
import { SystemOptionsManager } from "@/components/admin/settings/system-options-manager";
import { OpeningBalanceManager } from "@/components/admin/settings/opening-balance-manager";
import { TaskPriorityManager } from "@/components/admin/task-priority-manager";
import { TaskStatusManager } from "@/components/admin/settings/task-status-manager";
import { NotificationSettings } from "@/components/admin/settings/notification-settings";
import { getAdminProfile, getSystemOptions } from "@/lib/actions/adminActions";
import { User, Settings, DollarSign, ListFilter, CheckCircle, Bell } from "lucide-react";

export default async function SettingsPage() {
  // Use the actual admin email from database for SSR
  const adminEmail = 'vel@proultimaengineering.com';
  
  const profileResult = await getAdminProfile(adminEmail);
  const systemOptionsResult = await getSystemOptions(adminEmail);

  const adminData = profileResult.success && profileResult.data
    ? { name: profileResult.data.name, email: profileResult.data.email }
    : { name: "Admin User", email: "admin@proultima.com" };
    
  const systemOptions = systemOptionsResult.success && systemOptionsResult.data
    ? systemOptionsResult.data
    : { roles: [], departments: [], branches: [], expense_categories: [] };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and system options
        </p>
      </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-4xl grid-cols-2 md:grid-cols-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Options
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="priorities" className="flex items-center gap-2">
                <ListFilter className="h-4 w-4" />
                Task Priorities
              </TabsTrigger>
              <TabsTrigger value="statuses" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Task Statuses
              </TabsTrigger>
              <TabsTrigger value="opening-balance" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Opening Balances
              </TabsTrigger>
            </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings initialData={adminData} />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <SystemOptionsManager initialData={systemOptions} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="priorities" className="mt-6">
          <TaskPriorityManager />
        </TabsContent>

        <TabsContent value="statuses" className="mt-6">
          <TaskStatusManager />
        </TabsContent>

        <TabsContent value="opening-balance" className="mt-6">
          <OpeningBalanceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

