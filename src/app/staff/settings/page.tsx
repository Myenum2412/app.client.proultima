'use client';

import { ProfileSettingsForm } from '@/components/staff/profile-settings-form';
import { PasswordChangeForm } from '@/components/staff/password-change-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Lock } from 'lucide-react';

export default function StaffSettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and security settings
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Settings className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettingsForm />
        </TabsContent>
        
        <TabsContent value="security">
          <PasswordChangeForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

