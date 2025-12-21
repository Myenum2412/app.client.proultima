"use client";

import React from "react";
import { motion } from "motion/react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col items-center justify-center gap-4"
      >
        <div className="flex items-center justify-center space-x-2">
          <div className="bg-primary h-5 w-5 animate-bounce rounded-full [animation-delay:-0.3s]"></div>
          <div className="bg-primary h-5 w-5 animate-bounce rounded-full [animation-delay:-0.13s]"></div>
          <div className="bg-primary h-5 w-5 animate-bounce rounded-full"></div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-muted-foreground font-medium"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
}
