/**
 * Version History Manager for PDF Annotations
 */

import type { Annotation, AnnotationVersion } from "./types";

export class VersionHistoryManager {
  private versions: AnnotationVersion[] = [];
  private maxVersions: number;

  constructor(maxVersions: number = 50) {
    this.maxVersions = maxVersions;
  }

  createVersion(
    annotations: Annotation[],
    createdBy: string,
    description?: string
  ): AnnotationVersion {
    const versionNumber = this.versions.length + 1;
    const version: AnnotationVersion = {
      id: `v${Date.now()}-${versionNumber}`,
      versionNumber,
      annotations: JSON.parse(JSON.stringify(annotations)), // Deep clone
      createdAt: new Date().toISOString(),
      createdBy,
      description,
    };

    this.versions.push(version);

    // Limit history size
    if (this.versions.length > this.maxVersions) {
      this.versions.shift();
    }

    return version;
  }

  getVersion(versionNumber: number): AnnotationVersion | undefined {
    return this.versions.find((v) => v.versionNumber === versionNumber);
  }

  getAllVersions(): AnnotationVersion[] {
    return [...this.versions].reverse(); // Most recent first
  }

  getLatestVersion(): AnnotationVersion | undefined {
    return this.versions[this.versions.length - 1];
  }

  restoreVersion(versionNumber: number): Annotation[] | null {
    const version = this.getVersion(versionNumber);
    if (!version) return null;

    return JSON.parse(JSON.stringify(version.annotations)); // Deep clone
  }

  clearHistory(): void {
    this.versions = [];
  }

  getVersionCount(): number {
    return this.versions.length;
  }
}

