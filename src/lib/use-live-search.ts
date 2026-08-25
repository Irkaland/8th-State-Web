import { useEffect, useState } from "react";

/**
 * The live query string, kept in sync across client navigations.
 *
 * useSearchParams() would be the idiomatic read, but it forces every statically
 * rendered route that mounts the chrome into a Suspense boundary (or out of SSG
 * entirely). The locale switcher only needs the query to build one href, so it
 * reads location.search directly and re-reads it whenever the App Router
 * finishes a client navigation - pushState/replaceState included, which is how
 * the Work filters change the query without touching the pathname.
 */
export function useLiveSearch(): string {
  const [search, setSearch] = useState("");
  useEffect(() => {
    const sync = () => setSearch(window.location.search);
    sync();
    // history.pushState fires no event of its own, so wrap the two methods the
    // router uses and restore them on unmount
    const patch = (key: "pushState" | "replaceState") => {
      const original = history[key];
      history[key] = function (this: History, ...args: Parameters<History["pushState"]>) {
        const out = original.apply(this, args);
        sync();
        return out;
      };
      return () => {
        history[key] = original;
      };
    };
    const undoPush = patch("pushState");
    const undoReplace = patch("replaceState");
    window.addEventListener("popstate", sync);
    return () => {
      undoPush();
      undoReplace();
      window.removeEventListener("popstate", sync);
    };
  }, []);
  return search;
}
