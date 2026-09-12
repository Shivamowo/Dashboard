import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <form action="/api/logout" method="post">
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-control border border-ink-700 px-3 py-2 text-meta font-medium text-ink-300 transition-colors hover:bg-ink-900 hover:text-paper active:bg-ink-800"
      >
        <LogOut aria-hidden className="h-3.5 w-3.5" />
        Log out
      </button>
    </form>
  );
}
