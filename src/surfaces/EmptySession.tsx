import { type ReactNode } from "react";
import { basename } from "../lib/fs";
import { looksLikeProject } from "../lib/recents";
import { useLockOverscroll } from "../hooks/useLockOverscroll";

type Props = {
  cwd: string;
  composer?: ReactNode;
};

export function EmptySession({ cwd, composer }: Props) {
  const lockOverscroll = useLockOverscroll<HTMLDivElement>();
  const project = looksLikeProject(cwd) ? basename(cwd) : null;
  const title = project
    ? `What should we work on in ${project}?`
    : "What should we work on?";

  return (
    <div
      ref={lockOverscroll}
      className="empty-session app-scrollbar flex h-full min-h-0 min-w-0 overflow-y-auto overscroll-none"
    >
      {composer ? (
        <div className="empty-session-content mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col justify-center">
          <div className="mb-4 px-2.5">
            <h1
              className="text-balance break-words text-lg leading-snug text-content"
              title={project ? cwd : undefined}
            >
              {title}
            </h1>
          </div>

          <div className="w-full">{composer}</div>
        </div>
      ) : null}
    </div>
  );
}
