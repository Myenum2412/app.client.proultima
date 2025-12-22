"use client";
import React from "react";
import MaxWidthWrapper from "../MaxWidthWrapper";
import { motion } from "framer-motion";
import SubmissionsCard from "./SubmissionsCard";
import { SubmissionsTable } from "../submissions-table";
import { Submission } from "../submissions-table";

interface SubmissionsProps {
  initialSubmissions?: Submission[];
}

const Submissions = ({ initialSubmissions = [] }: SubmissionsProps) => {
  return (
    <MaxWidthWrapper>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1  overflow-x-hidden p-3  my-4 w-full"
      >
        <div className="space-y-6 overflow-x-hidden">
          <SubmissionsCard initialSubmissions={initialSubmissions} />
        </div>
        <div className="overflow-x-hidden">
          <SubmissionsTable initialSubmissions={initialSubmissions} />
        </div>
      </motion.main>
    </MaxWidthWrapper>
  );
};

export default Submissions;
