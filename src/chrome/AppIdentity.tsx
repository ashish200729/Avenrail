import { APP_DESCRIPTION, APP_ICON, APP_NAME } from "../lib/brand";

/** Identity belongs on launch and About surfaces, not in the working controls. */
export function AppIdentity() {
  return (
    <div className="flex items-center gap-4">
      <img src={APP_ICON} alt="" className="size-16" />
      <div className="min-w-0">
        <p className="text-xl font-medium tracking-tight text-content">
          {APP_NAME}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-content/65">
          {APP_DESCRIPTION}
        </p>
      </div>
    </div>
  );
}
