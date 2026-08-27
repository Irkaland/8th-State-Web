import { describe, expect, it, beforeEach } from "vitest";
import { focusableWithin, isFocusable } from "@/lib/focusable";

/**
 * §P0: the burger focus trap used `el.offsetParent !== null` to decide what
 * could take focus. That is not a focusability test, and in particular it does
 * not exclude `inert` - which is exactly how the collapsed Work category links
 * stayed in the trap's candidate list and froze Tab on the WORK link.
 *
 * These cover the predicate directly, so the guarantee is stated once rather
 * than inferred from browser behaviour, and so a future collapsed region cannot
 * reintroduce the same class of bug.
 */

function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return document.getElementById("root")!;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("isFocusable", () => {
  it("accepts an ordinary link and button", () => {
    const root = mount(`<a href="/work">Work</a><button type="button">Menu</button>`);
    for (const el of Array.from(root.children) as HTMLElement[]) {
      expect(isFocusable(el), el.tagName).toBe(true);
    }
  });

  it("rejects an element inside an inert container - the actual P0 cause", () => {
    const root = mount(`<div inert><a href="/work?category=film-video">Film &amp; Video</a></div>`);
    const link = root.querySelector("a")!;
    // the old filter's verdict, kept here so the regression is unambiguous:
    // offsetParent is NOT null for an inert element, which is why it passed
    expect(isFocusable(link)).toBe(false);
  });

  it("rejects the inert container itself", () => {
    const root = mount(`<button type="button" inert>01</button>`);
    expect(isFocusable(root.querySelector("button")!)).toBe(false);
  });

  it("rejects a nested inert subtree at any depth", () => {
    const root = mount(`<div inert><section><span><a href="/x">deep</a></span></section></div>`);
    expect(isFocusable(root.querySelector("a")!)).toBe(false);
  });

  it("rejects disabled, aria-disabled and fieldset-disabled controls", () => {
    const root = mount(`
      <button type="button" disabled>a</button>
      <button type="button" aria-disabled="true">b</button>
      <fieldset disabled><input id="c" /></fieldset>
    `);
    expect(isFocusable(root.querySelectorAll("button")[0] as HTMLElement)).toBe(false);
    expect(isFocusable(root.querySelectorAll("button")[1] as HTMLElement)).toBe(false);
    expect(isFocusable(root.querySelector("input")!)).toBe(false);
  });

  it("rejects hidden, aria-hidden and negative-tabindex elements", () => {
    const root = mount(`
      <a href="/a" hidden>a</a>
      <a href="/b" aria-hidden="true">b</a>
      <a href="/c" tabindex="-1">c</a>
    `);
    for (const el of Array.from(root.querySelectorAll("a")) as HTMLElement[]) {
      expect(isFocusable(el), el.getAttribute("href") ?? "").toBe(false);
    }
  });

  it("accepts an explicit tabindex=0 on a non-native control", () => {
    const root = mount(`<div tabindex="0">stage</div>`);
    expect(isFocusable(root.querySelector("div")!)).toBe(true);
  });

  it("keeps zero-opacity controls focusable - the chrome fades but stays operable", () => {
    // the idle chrome animates its controls to opacity 0 while keeping them
    // usable for keyboard visitors; excluding them would empty the trap
    const root = mount(`<a href="/" style="opacity:0">8th State</a>`);
    expect(isFocusable(root.querySelector("a")!)).toBe(true);
  });
});

describe("focusableWithin", () => {
  it("returns candidates in DOM order - the order the trap must reproduce", () => {
    const root = mount(`
      <button type="button" id="one">01</button>
      <a href="/work" id="two">WORK</a>
      <a href="/services" id="three">SERVICES</a>
    `);
    expect(focusableWithin(root).map((el) => el.id)).toEqual(["one", "two", "three"]);
  });

  it("skips an inert region and keeps everything around it - the burger's shape", () => {
    const root = mount(`
      <button type="button" id="toggle">01</button>
      <a href="/work" id="work">WORK</a>
      <div inert id="cats">
        <a href="/work?category=film-video">Film</a>
        <a href="/work?category=photography">Photography</a>
        <a href="/work?category=production-spatial">Spatial</a>
        <a href="/work?category=studio-lab">Lab</a>
        <a href="/work">Archive</a>
      </div>
      <a href="/services" id="services">SERVICES</a>
    `);
    // the five collapsed category links must not appear at all
    expect(focusableWithin(root).map((el) => el.id)).toEqual(["toggle", "work", "services"]);
  });

  it("includes the same region once it is no longer inert", () => {
    const root = mount(`
      <a href="/work" id="work">WORK</a>
      <div id="cats"><a href="/work?category=film-video" id="film">Film</a></div>
      <a href="/services" id="services">SERVICES</a>
    `);
    expect(focusableWithin(root).map((el) => el.id)).toEqual(["work", "film", "services"]);
  });
});
