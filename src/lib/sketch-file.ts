import type { SketchFile } from "@/types/sketch";

const CURRENT_SCHEMA_VERSION = 1;
const APP_VERSION = "0.1.0";

/**
 * Wraps a tldraw document snapshot in the SketchGit schema envelope.
 * This wrapper is what gets committed to GitHub — it ensures we can
 * migrate old files when the tldraw SDK changes its serialization format.
 */
export function wrapSnapshot(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  schemaVersion: number = CURRENT_SCHEMA_VERSION
): SketchFile {
  return {
    schemaVersion,
    appVersion: APP_VERSION,
    data,
  };
}

/**
 * Unwraps a SketchFile envelope, validating the schema version
 * and running any necessary migrations.
 */
export function unwrapSnapshot(
  file: SketchFile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  const migrated = migrateIfNeeded(file);
  return migrated.data;
}

/**
 * Migration hook — currently a no-op for schema version 1.
 * When tldraw's format changes, add migration logic keyed off schemaVersion.
 */
export function migrateIfNeeded(file: SketchFile): SketchFile {
  if (file.schemaVersion === CURRENT_SCHEMA_VERSION) {
    return file;
  }

  // Future migrations go here:
  // if (file.schemaVersion === 1) {
  //   file = migrateV1ToV2(file);
  // }

  console.warn(
    `Unknown schema version ${file.schemaVersion}, attempting to load as-is.`
  );
  return file;
}

/**
 * Creates a SketchFile with an empty tldraw document.
 * This is used when the user creates a brand-new page.
 */
export function createEmptyPage(): SketchFile {
  return wrapSnapshot({});
}

/**
 * Validates that a parsed JSON object looks like a valid SketchFile.
 */
export function isValidSketchFile(obj: unknown): obj is SketchFile {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.schemaVersion === "number" &&
    typeof record.appVersion === "string" &&
    typeof record.data === "object" &&
    record.data !== null
  );
}
