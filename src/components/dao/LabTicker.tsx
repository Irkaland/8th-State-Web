import { Fragment } from "react";
import { up } from "@/lib/cn";

/**
 * Studio Lab Glacier ticker row (§08/§09). Words are separated by the
 * brand four-point star asset instead of the ✳ character - U+2733 renders
 * as an emoji or a missing glyph on several mobile font stacks. Two
 * identical halves make the -50% translate loop seamless.
 */
export function LabTickerRow({ words }: { words: string[] }) {
  const half = (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          {up(w)}
          <span className="dao-lab__tickstar dao-mask" aria-hidden="true" />
        </Fragment>
      ))}
    </>
  );
  return (
    <div className="dao-lab__tickerrow">
      <span>{half}</span>
      <span>{half}</span>
    </div>
  );
}
