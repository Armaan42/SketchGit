"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import SaveToolbar from "./SaveToolbar";
import { wrapSnapshot, unwrapSnapshot, isValidSketchFile } from "@/lib/sketch-file";

interface SketchEditorProps {
  owner: string;
  repo: string;
  page: string;
  initialContent?: string | null;
  initialSha?: string | null;
}

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error" | "conflict";

export default function SketchEditor({
  owner,
  repo,
  page,
  initialContent,
  initialSha,
}: SketchEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [sha, setSha] = useState<string | null>(initialSha || null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const hasLoadedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const skipNextChangeRef = useRef(false);

  // Allow Excalidraw 500ms to settle its initial render before we start tracking changes.
  // This prevents the "Unsaved changes" status from appearing immediately on load,
  // while ensuring we don't accidentally ignore the user's first actual stroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      hasLoadedRef.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // We parse the initial data to pass to Excalidraw's initialData prop
  const getInitialData = () => {
    if (!initialContent) return null;
    try {
      const parsed = JSON.parse(initialContent);
      if (isValidSketchFile(parsed)) {
        const data = unwrapSnapshot(parsed);
        // Excalidraw expects { elements, appState, files }
        // If it's old Tldraw data, it won't have elements, so it will just be ignored
        if (data && data.elements) {
          return {
            elements: data.elements,
            appState: data.appState || {},
            files: data.files || null,
          };
        }
      }
    } catch (err) {
      console.error("Failed to parse initial content:", err);
    }
    return null;
  };

  const initialData = getInitialData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = useCallback((elements: readonly any[], appState: any) => {
    if (!hasLoadedRef.current) return;

    if (skipNextChangeRef.current) {
      skipNextChangeRef.current = false;
      return;
    }

    isDirtyRef.current = true;
    setSaveStatus((prev) => (prev !== "unsaved" ? "unsaved" : prev));
  }, []);

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      // Only save the necessary appState fields to avoid massive files
      const snapshot = {
        type: "excalidraw",
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
        },
        files,
      };

      const wrapped = wrapSnapshot(snapshot);
      const content = JSON.stringify(wrapped, null, 2);

      const body: Record<string, string> = {
        owner,
        repo,
        path: `pages/${page}.json`,
        content,
        message: `Update ${page}`,
      };

      if (sha) {
        body.sha = sha;
      }

      const res = await fetch("/api/github/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.type === "conflict") {
          setSaveStatus("conflict");
          setErrorMessage(
            "This page was modified elsewhere. Reload to get the latest version."
          );
          return;
        }
        throw new Error(data.error || "Failed to save");
      }

      const result = await res.json();
      setSha(result.sha);
      isDirtyRef.current = false;
      setSaveStatus("saved");

      setTimeout(() => {
        if (!isDirtyRef.current) {
          setSaveStatus("idle");
        }
      }, 2000);
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save"
      );
    }
  }, [excalidrawAPI, owner, repo, page, sha]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Warn about unsaved changes on page leave
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <div
      className="fixed inset-0"
      id="sketch-editor-container"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialData || undefined}
        onChange={handleChange}
        theme="dark"
      />
      <SaveToolbar
        owner={owner}
        repo={repo}
        page={page}
        status={saveStatus}
        errorMessage={errorMessage}
        onSave={handleSave}
        onReload={handleReload}
      />
    </div>
  );
}
