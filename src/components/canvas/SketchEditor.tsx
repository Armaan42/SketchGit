"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from "tldraw";
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
  const [editor, setEditor] = useState<Editor | null>(null);
  const [sha, setSha] = useState<string | null>(initialSha || null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const isDirtyRef = useRef(false);

  // Load initial content into the editor when it mounts
  const handleMount = useCallback(
    (editor: Editor) => {
      setEditor(editor);

      if (initialContent && !hasLoadedRef.current) {
        try {
          // If we have a persistenceKey, Tldraw will load from IndexedDB automatically.
          // But if this is the first time (no local data yet), or we want to ensure GitHub
          // data is loaded initially, we can safely let it load here.
          const parsed = JSON.parse(initialContent);
          if (isValidSketchFile(parsed)) {
            const data = unwrapSnapshot(parsed);
            if (data && Object.keys(data).length > 0) {
              if (data.store && data.schema) {
                loadSnapshot(editor.store, { document: data as any });
              } else if (data.document) {
                loadSnapshot(editor.store, data as any);
              } else {
                loadSnapshot(editor.store, { document: data as any });
              }
            }
          }
          hasLoadedRef.current = true;
          setSaveStatus("idle");
        } catch (err) {
          console.error("Failed to load snapshot:", err);
          setSaveStatus("error");
          setErrorMessage("Failed to load canvas data. The file may be corrupted.");
        }
      }
    },
    [initialContent]
  );

  // Listen for store changes to track dirty state safely outside of Tldraw's render
  useEffect(() => {
    if (!editor) return;

    const unsub = editor.store.listen(
      () => {
        if (hasLoadedRef.current || !initialContent) {
          isDirtyRef.current = true;
          setSaveStatus((prev) => (prev !== "unsaved" ? "unsaved" : prev));
        }
      },
      { source: "user", scope: "document" }
    );

    return () => unsub();
  }, [editor, initialContent]);

  const handleSave = useCallback(async () => {
    if (!editor) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      // Get the current document snapshot from tldraw
      const snapshot = getSnapshot(editor.store);
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

      // Reset status after a moment
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
  }, [editor, owner, repo, page, sha]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sha]);

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
      <Tldraw 
        persistenceKey={`sketchgit-${owner}-${repo}-${page}`}
        onMount={handleMount} 
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
