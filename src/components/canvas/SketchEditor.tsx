"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from "tldraw";
import "tldraw/tldraw.css";
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
  const editorRef = useRef<Editor | null>(null);
  const [sha, setSha] = useState<string | null>(initialSha || null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const isDirtyRef = useRef(false);

  // Load initial content into the editor when it mounts
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      if (initialContent && !hasLoadedRef.current) {
        try {
          const parsed = JSON.parse(initialContent);
          if (isValidSketchFile(parsed)) {
            const data = unwrapSnapshot(parsed);
            // Only load if there's actual data
            if (data && Object.keys(data).length > 0) {
              // The data is a document snapshot from getSnapshot()
              // loadSnapshot expects { document: StoreSnapshot<TLRecord> }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              loadSnapshot(editor.store, { document: data as any });
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

      // Listen for store changes to track dirty state
      const unsub = editor.store.listen(
        () => {
          if (hasLoadedRef.current || !initialContent) {
            isDirtyRef.current = true;
            setSaveStatus("unsaved");
          }
        },
        { source: "user", scope: "document" }
      );

      return () => {
        unsub();
      };
    },
    [initialContent]
  );

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

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      // Get the current document snapshot from tldraw
      const { document } = getSnapshot(editor.store);
      const wrapped = wrapSnapshot(document);
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
  }, [owner, repo, page, sha]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="fixed inset-0" id="sketch-editor-container">
      <Tldraw onMount={handleMount} />
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
