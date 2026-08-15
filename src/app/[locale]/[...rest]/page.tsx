import { notFound } from "next/navigation";

// Any dead URL or reserved path resolves to the displaced-frame 404
// (handoff 4g / 4i) - never the framework default, never a dead end.
export default function CatchAll(): never {
  notFound();
}
