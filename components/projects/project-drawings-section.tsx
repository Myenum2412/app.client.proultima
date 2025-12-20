"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawingsYetToReturnTable } from "@/components/files-drawings-yet-to-return-table";
import {
  DrawingsYetToReleaseTable,
  type DrawingsYetToReleaseTableRef,
} from "@/components/files-drawings-yet-to-release-table";
import {
  DrawingLogTable,
  type DrawingLogTableRef,
} from "@/components/files-drawing-log-table";
import { Project } from "./types";
import { motion, AnimatePresence } from "motion/react";

interface ProjectDrawingsSectionProps {
  project: Project;
}

export function ProjectDrawingsSection({ project }: ProjectDrawingsSectionProps) {
  // Drawings Yet to Release table ref for email icon
  const drawingsYetToReleaseTableRef =
    useRef<DrawingsYetToReleaseTableRef>(null);
  const [emailIconState, setEmailIconState] = useState({
    disabled: true,
    selectedCount: 0,
  });

  // Drawing Log table ref for email icon
  const drawingLogTableRef = useRef<DrawingLogTableRef>(null);
  const [drawingLogEmailIconState, setDrawingLogEmailIconState] = useState({
    disabled: true,
    selectedCount: 0,
  });

  // Update email icon state when table ref changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (drawingsYetToReleaseTableRef.current) {
        setEmailIconState({
          disabled: drawingsYetToReleaseTableRef.current.isEmailDisabled,
          selectedCount: drawingsYetToReleaseTableRef.current.selectedCount,
        });
      }
      if (drawingLogTableRef.current) {
        setDrawingLogEmailIconState({
          disabled: drawingLogTableRef.current.isEmailDisabled,
          selectedCount: drawingLogTableRef.current.selectedCount,
        });
      }
    }, 100); // Check every 100ms for selection changes

    return () => clearInterval(interval);
  }, []);

  const projectId = project.supabaseId || project.id?.toString();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={project.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Drawings Yet to Return */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Drawings Yet to Return (APP/R&R)</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Send selected drawings via email"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 p-4">
              <div className="w-full">
                <DrawingsYetToReturnTable
                  drawings={project.drawingsYetToReturn}
                  projectId={projectId}
                  projectNumber={project.projectNumber}
                  projectName={project.projectName}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Drawings Yet to Release */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Drawings Yet to Release</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    drawingsYetToReleaseTableRef.current?.handleEmail()
                  }
                  disabled={emailIconState.disabled}
                  className={cn(
                    "h-8 w-8",
                    emailIconState.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  title={
                    emailIconState.disabled
                      ? "Select drawings to email"
                      : `Open Outlook with ${emailIconState.selectedCount} selected drawing(s)`
                  }
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 p-4">
              <div className="w-full">
                <DrawingsYetToReleaseTable
                  ref={drawingsYetToReleaseTableRef}
                  drawings={project.drawingsYetToRelease}
                  projectId={projectId}
                  projectNumber={project.projectNumber}
                  projectName={project.projectName}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* DrawingLog */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Drawing Log</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => drawingLogTableRef.current?.handleEmail()}
                  disabled={drawingLogEmailIconState.disabled}
                  className={cn(
                    "h-8 w-8",
                    drawingLogEmailIconState.disabled &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  title={
                    drawingLogEmailIconState.disabled
                      ? "Select drawings to email"
                      : `Open Outlook with ${drawingLogEmailIconState.selectedCount} selected drawing(s)`
                  }
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 p-4">
              <div className="w-full">
                <DrawingLogTable
                  ref={drawingLogTableRef}
                  drawings={project.drawingLog}
                  projectId={projectId}
                  projectNumber={project.projectNumber}
                  projectName={project.projectName}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

