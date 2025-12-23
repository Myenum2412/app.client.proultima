/**
 * Version Manager for PDF Editor
 * Handles version tracking, history, and rollback
 */

import type { PDFVersion, PDFEditorState } from "./types";

export class VersionManager {
  private versions: PDFVersion[] = [];
  private currentVersionNumber: number = 1;
  private maxVersions: number = 100;

  constructor(initialVersion?: PDFVersion) {
    if (initialVersion) {
      this.versions.push(initialVersion);
      this.currentVersionNumber = initialVersion.versionNumber;
    }
  }

  createVersion(
    state: Partial<PDFEditorState>,
    createdBy: string,
    description?: string
  ): PDFVersion {
    const version: PDFVersion = {
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      versionNumber: this.currentVersionNumber + 1,
      pdfBlob: state.pdfBlob || new Blob(),
      annotations: state.annotations || [],
      textEdits: state.textEdits || [],
      imageEdits: state.imageEdits || [],
      formFields: state.formFields || [],
      signatures: state.signatures || [],
      pageOperations: state.pageOperations || [],
      createdAt: new Date().toISOString(),
      createdBy,
      description,
      size: state.pdfBlob?.size || 0,
    };

    this.versions.push(version);
    this.currentVersionNumber = version.versionNumber;

    // Keep only the most recent versions
    if (this.versions.length > this.maxVersions) {
      this.versions = this.versions.slice(-this.maxVersions);
    }

    return version;
  }

  getVersion(versionNumber: number): PDFVersion | undefined {
    return this.versions.find((v) => v.versionNumber === versionNumber);
  }

  getAllVersions(): PDFVersion[] {
    return [...this.versions].sort(
      (a, b) => b.versionNumber - a.versionNumber
    );
  }

  getCurrentVersion(): PDFVersion | undefined {
    return this.versions[this.versions.length - 1];
  }

  rollbackToVersion(versionNumber: number): PDFVersion | null {
    const version = this.getVersion(versionNumber);
    if (!version) return null;

    // Create a new version from the rolled-back state
    const rolledBackVersion: PDFVersion = {
      ...version,
      id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      versionNumber: this.currentVersionNumber + 1,
      createdAt: new Date().toISOString(),
      description: `Rollback to version ${versionNumber}`,
    };

    this.versions.push(rolledBackVersion);
    this.currentVersionNumber = rolledBackVersion.versionNumber;

    return rolledBackVersion;
  }

  compareVersions(
    version1: number,
    version2: number
  ): {
    added: any[];
    removed: any[];
    modified: any[];
  } {
    const v1 = this.getVersion(version1);
    const v2 = this.getVersion(version2);

    if (!v1 || !v2) {
      return { added: [], removed: [], modified: [] };
    }

    // Compare annotations
    const v1AnnotationIds = new Set(v1.annotations.map((a) => a.id));
    const v2AnnotationIds = new Set(v2.annotations.map((a) => a.id));

    const added = v2.annotations.filter((a) => !v1AnnotationIds.has(a.id));
    const removed = v1.annotations.filter((a) => !v2AnnotationIds.has(a.id));
    const modified = v2.annotations.filter((a) => {
      const v1Annotation = v1.annotations.find((a1) => a1.id === a.id);
      return v1Annotation && JSON.stringify(v1Annotation) !== JSON.stringify(a);
    });

    return { added, removed, modified };
  }

  deleteVersion(versionNumber: number): boolean {
    const index = this.versions.findIndex(
      (v) => v.versionNumber === versionNumber
    );
    if (index === -1) return false;

    this.versions.splice(index, 1);
    return true;
  }

  exportVersionHistory(): string {
    return JSON.stringify(
      this.versions.map((v) => ({
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        createdBy: v.createdBy,
        description: v.description,
        size: v.size,
      })),
      null,
      2
    );
  }
}

