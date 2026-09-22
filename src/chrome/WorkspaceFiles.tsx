import { Search, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  loadProjectFiles,
  peekProjectFiles,
  rankProjectFiles,
} from "../lib/fileIndex";
import { subscribeDirsChanged } from "../lib/fileTree";
import { FileTree } from "./FileTree";
import { FileTypeIcon } from "./FileTypeIcon";

export function WorkspaceFiles(props: ComponentProps<typeof FileTree>) {
  const [query, setQuery] = useState("");
  const filterInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState(() => peekProjectFiles(props.cwd) ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(
    () => subscribeDirsChanged(() => setVersion((value) => value + 1)),
    [],
  );
  useEffect(() => {
    setQuery("");
    setFiles(peekProjectFiles(props.cwd) ?? []);
  }, [props.cwd]);
  useEffect(() => {
    if (!query.trim() || props.active === false) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    void loadProjectFiles(props.cwd)
      .then((next) => {
        if (!cancelled) setFiles(next);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [props.cwd, props.active, query, version]);
  const results = useMemo(
    () => rankProjectFiles(files, query, []),
    [files, query],
  );
  return (
    <FileTree
      {...props}
      key={props.cwd}
      hideRoot
      onClearFilter={() => setQuery("")}
      filterInput={
        <div className="relative mx-2 mb-2 flex h-8 shrink-0 items-center rounded-lg border border-content/15 bg-content/3 focus-within:border-accent/60">
          <Search
            className="ml-2 size-3.5 shrink-0 text-content/50"
            aria-hidden
          />
          <input
            ref={filterInput}
            aria-label="Filter files by name"
            placeholder="Filter by name…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                setQuery("");
              }
            }}
            className="min-w-0 flex-1 bg-transparent px-2 text-xs text-content outline-none placeholder:text-content/60"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear file filter"
              onClick={() => {
                setQuery("");
                filterInput.current?.focus();
              }}
              className="mr-1 grid size-6 place-items-center rounded hover:bg-content/10 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <X className="size-3" aria-hidden />
            </button>
          ) : null}
        </div>
      }
      filterResults={
        query.trim() ? (
          <div className="p-1" aria-live="polite">
            {loading ? (
              <p className="p-2 text-xs text-content/60">Searching files…</p>
            ) : error ? (
              <p className="p-2 text-xs text-content/60">
                Couldn’t load files. Try your search again.
              </p>
            ) : !results.length ? (
              <p className="p-2 text-xs text-content/60">No matching files</p>
            ) : (
              results.map((file) => (
                <button
                  type="button"
                  key={file.path}
                  title={file.relative}
                  onClick={() => props.onOpenFile(file.path)}
                  className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-content/8 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <FileTypeIcon name={file.name} isDir={false} />
                  <span className="min-w-0 truncate">{file.relative}</span>
                </button>
              ))
            )}
          </div>
        ) : null
      }
    />
  );
}
