import { expect, test } from "@playwright/test";
import { probeWebKitMediaCapability, webKitMediaUnavailableMessage } from "./media-capability";

test.describe("WebKit media runtime capability", () => {
  test("classifies whether the local runtime can decode and advance media", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-safari", "WebKit-only media runtime probe");

    const capability = await probeWebKitMediaCapability(page);

    if (!capability.available) {
      expect(capability.classification).toBe("webkit-media-runtime-unavailable");
      if (capability.details.errorCode !== null) expect(capability.details.errorCode).toBe(4);
      console.log(webKitMediaUnavailableMessage());
      return;
    }

    expect(capability.classification).toBe("available");
    expect(capability.details.readyState).toBeGreaterThan(0);
    expect(capability.details.errorCode).toBeNull();
    expect(capability.details.playResolved || capability.details.events.includes("playing")).toBe(
      true,
    );
    expect(capability.details.currentTime).toBeGreaterThan(0.1);
  });
});
