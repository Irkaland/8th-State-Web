import { test, type Page, type TestInfo } from "@playwright/test";

export type WebKitMediaCapability = {
  available: boolean;
  classification: "available" | "webkit-media-runtime-unavailable";
  reason: string;
  details: {
    src: string;
    canPlayType: string;
    readyState: number;
    networkState: number;
    currentTime: number;
    paused: boolean;
    ended: boolean;
    errorCode: number | null;
    errorMessage: string | null;
    playResolved: boolean;
    playRejected: string | null;
    events: string[];
  };
};

let cachedCapability: WebKitMediaCapability | null = null;

const WEBKIT_UNAVAILABLE_MESSAGE =
  "WebKit media decode unavailable in local test runtime; production Safari validation required.";

export async function probeWebKitMediaCapability(page: Page): Promise<WebKitMediaCapability> {
  if (cachedCapability) return cachedCapability;

  await page.goto("/", { waitUntil: "domcontentloaded" });

  cachedCapability = await page.evaluate(async () => {
    const src = new URL("/media/showreel.mp4", window.location.href).href;
    const video = document.createElement("video");
    const events: string[] = [];

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.style.cssText =
      "position:fixed;left:0;top:0;width:160px;height:90px;opacity:0.01;pointer-events:none;";

    const snapshot = () => ({
      src,
      canPlayType: video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),
      readyState: video.readyState,
      networkState: video.networkState,
      currentTime: Number(video.currentTime.toFixed(3)),
      paused: video.paused,
      ended: video.ended,
      errorCode: video.error?.code ?? null,
      errorMessage: video.error?.message || null,
    });

    const eventNames = [
      "loadstart",
      "loadedmetadata",
      "loadeddata",
      "canplay",
      "playing",
      "timeupdate",
      "error",
      "stalled",
    ] as const;
    for (const eventName of eventNames) {
      video.addEventListener(eventName, () => events.push(eventName));
    }

    document.body.append(video);

    let playResolved = false;
    let playRejected: string | null = null;

    const done = await new Promise<WebKitMediaCapability>((resolve) => {
      const startedAt = performance.now();
      const timeoutMs = 8000;

      const finish = (available: boolean, reason: string) => {
        window.clearInterval(interval);
        window.clearTimeout(timeout);
        const details = { ...snapshot(), playResolved, playRejected, events: [...events] };
        video.remove();
        resolve({
          available,
          classification: available ? "available" : "webkit-media-runtime-unavailable",
          reason,
          details,
        });
      };

      const check = () => {
        if (video.error) {
          finish(false, `media element failed with code ${video.error.code}`);
          return;
        }
        if (
          video.readyState > HTMLMediaElement.HAVE_NOTHING &&
          video.currentTime > 0.1 &&
          !video.paused &&
          (playResolved || events.includes("playing"))
        ) {
          finish(true, "media element loaded, played, and advanced");
        }
      };

      const interval = window.setInterval(check, 100);
      const timeout = window.setTimeout(() => {
        finish(false, `media element did not prove playback within ${timeoutMs}ms`);
      }, timeoutMs);

      video.addEventListener("error", check);
      video.addEventListener("timeupdate", check);
      video.addEventListener("playing", check);

      video.src = src;
      video.load();
      void video
        .play()
        .then(() => {
          playResolved = true;
          check();
        })
        .catch((error: unknown) => {
          const name = error instanceof DOMException ? error.name : "Error";
          playRejected = `${name}: ${String(error)}`;
          if (performance.now() - startedAt > 250) check();
        });
    });

    return done;
  });

  console.log(
    `WebKit media capability probe: ${cachedCapability.classification} ` +
      JSON.stringify(cachedCapability.details),
  );

  return cachedCapability;
}

export async function skipWhenWebKitMediaUnavailable(page: Page, testInfo: TestInfo) {
  if (testInfo.project.name !== "mobile-safari") return;

  const capability = await probeWebKitMediaCapability(page);
  if (!capability.available) {
    test.skip(true, `${WEBKIT_UNAVAILABLE_MESSAGE} Probe: ${capability.reason}`);
  }
}

export function webKitMediaUnavailableMessage() {
  return WEBKIT_UNAVAILABLE_MESSAGE;
}
