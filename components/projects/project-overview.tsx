"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin } from "lucide-react";
import Link from "next/link";
import type { Project } from "./types";
import { getStatusColor } from "./utils";
import { EvaluationLogForm } from "@/components/evaluation-log-form";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface ProjectOverviewProps {
  project: Project;
  onEvaluationLogClick?: () => void;
}

export function ProjectOverview({ project, onEvaluationLogClick }: ProjectOverviewProps) {
  const [isEvaluationFormOpen, setIsEvaluationFormOpen] = useState(false);

  const handleEvaluationClick = () => {
    if (onEvaluationLogClick) {
      onEvaluationLogClick();
    } else {
      setIsEvaluationFormOpen(true);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{project.projectName}</span>
                <Badge className={getStatusColor(project.status.detailing)}>
                  {project.projectNumber}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="text-sm text-gray-500">Project Name</div>
              <div className="font-medium">{project.projectName}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-sm text-gray-500">Pro Number</div>
              <div className="font-medium">{project.projectNumber}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="text-sm text-gray-500">Job Number</div>
              <div className="font-medium">{project.projectNumber}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm text-gray-500">Fabricator Name</div>
              <div className="font-medium">{project.clientName}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="text-sm text-gray-500">Contractor Name</div>
              <div className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {project.contractor}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-gray-500">Project Location</div>
              <div className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {project.projectLocation}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="text-sm text-gray-500">Estimated Tons</div>
              <motion.div
                className="font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={handleEvaluationClick}
                title="Click to open Evaluation Log"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                {(project.estimatedTonnage || 0).toLocaleString()}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-sm text-gray-500">
                Detailed Tons per Approval dwgs
              </div>
              <div className="font-medium">
                {(project.detailingTonsPerApproval || 0).toLocaleString()}
                {project.estimatedTonnage > 0 &&
                  ` (${Math.round(
                    ((project.detailingTonsPerApproval || 0) /
                      project.estimatedTonnage) *
                      100
                  )}%)`}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="text-sm text-gray-500">
                Detailed Tons per latest Rev/FFU
              </div>
              <div className="font-medium">
                {(project.detailingTonsPerLatestRevFFU || 0).toLocaleString()}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-sm text-gray-500">
                Released Tons (so far)
              </div>
              <div className="font-medium">
                {(project.releasedTonsSoFar || 0).toLocaleString()}
                {project.estimatedTonnage > 0 &&
                  ` (${Math.round(
                    ((project.releasedTonsSoFar || 0) /
                      project.estimatedTonnage) *
                      100
                  )}%)`}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className="text-sm text-gray-500">Detailing Status</div>
              <Badge className={getStatusColor(project.status.detailing)}>
                {project.status.detailing}
              </Badge>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-sm text-gray-500">Revision Status</div>
              <Badge className={getStatusColor(project.status.revision)}>
                {project.status.revision}
              </Badge>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <div className="text-sm text-gray-500">Release Status</div>
              <Badge className={getStatusColor(project.status.release)}>
                {project.status.release}
              </Badge>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="text-sm text-gray-500">Evaluation Log</div>
              <Link
                href="/evaluation-log"
                className="text-sm font-medium text-primary hover:underline transition-colors"
              >
                View Evaluation Log
              </Link>
            </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Evaluation Log Form */}
      <EvaluationLogForm
        open={isEvaluationFormOpen}
        onOpenChange={setIsEvaluationFormOpen}
        projectNumber={project.projectNumber}
        projectName={project.projectName}
        estimatedTons={project.estimatedTonnage || 0}
      />
    </>
  );
}

