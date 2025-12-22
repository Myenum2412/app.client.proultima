"use client";

import { Suspense } from "react";
import { motion } from "motion/react";
import { DashboardCards } from "./DashboardCards";
import { LoadingState } from "@/components/ui/loading-state";
import ScheduleMeetingForm from "./ScheduleMeetingForm";
import ActivityFeed from "./ActivityFeed";

function DashboardContent() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex-1  overflow-hidden p-3  my-4 w-full max-w-full"
    >
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        {/* Dashboard Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-full overflow-hidden"
        >
          <DashboardCards />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
        >
          <ScheduleMeetingForm />
          <ActivityFeed />
        </motion.div>
      </div>
    </motion.main>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState message="Loading dashboard..." />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
