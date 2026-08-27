/**
 * Turns a greyscale/alpha bitmap into closed vector contours.
 *
 * The brandbook is a raster export: every mark exists only as an embedded
 * image plus a soft mask, and several of those masks are SMALLER than the box
 * the site draws them in. Resampling can only ever soften such a mark - the
 * detail is not there to recover - so where a mark is a flat SILHOUETTE the
 * honest fix is to keep the artwork's own outline and stop shipping pixels.
 *
 * The contour is read at the iso-level the anti-aliasing already encodes
 * (alpha = 0.5) with linear interpolation along each cell edge, so the outline
 * lands exactly where the printed edge lands - including the brandbook's own
 * irregular, distressed contour. Nothing is smoothed, rounded or re-drawn;
 * Ramer-Douglas-Peucker only drops points that lie within `epsilon` of the
 * line they already sit on.
 *
 * Marching squares, iso-level 0.5, on the sample grid (cell centres), so the
 * result is in source-pixel coordinates offset by half a pixel - which is
 * where the samples actually are.
 */

/**
 * The 16 cell cases as DIRECTED edge pairs [from, to] - edge ids 0=top 1=right
 * 2=bottom 3=left, case index = TL*8 + TR*4 + BR*2 + BL*1.
 *
 * Every segment is oriented so the filled side is on its RIGHT, which in a
 * y-down space means each ring is traversed clockwise around ink and
 * counter-clockwise around a hole. That is what lets the segments be chained
 * end-to-end into closed rings, and what makes holes come out with the
 * opposite winding from the outline that contains them.
 */
const CASES = [
  [], // 0  empty
  [[3, 2]], // 1  BL
  [[2, 1]], // 2  BR
  [[3, 1]], // 3  BL+BR
  [[1, 0]], // 4  TR
  [
    [1, 0],
    [3, 2],
  ], // 5  TR+BL (saddle)
  [[2, 0]], // 6  TR+BR
  [[3, 0]], // 7  all but TL
  [[0, 3]], // 8  TL
  [[0, 2]], // 9  TL+BL
  [
    [0, 3],
    [2, 1],
  ], // 10 TL+BR (saddle)
  [[0, 1]], // 11 all but TR
  [[1, 3]], // 12 TL+TR
  [[1, 2]], // 13 all but BR
  [[2, 3]], // 14 all but BL
  [], // 15 full
];

/**
 * @param {Uint8Array|Buffer} a  alpha, one byte per sample, row-major
 * @param {number} W  samples per row
 * @param {number} H  rows
 * @param {number} iso  0..1 iso-level (0.5 = the anti-aliased edge)
 * @returns {Array<Array<[number, number]>>} closed rings, source-pixel coords
 */
export function contours(a, W, H, iso = 0.5) {
  const v = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : a[y * W + x] / 255);
  /** where the iso-level crosses the edge between two samples */
  const cut = (x0, y0, x1, y1) => {
    const a0 = v(x0, y0);
    const a1 = v(x1, y1);
    const t = a1 === a0 ? 0.5 : (iso - a0) / (a1 - a0);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  };

  /** every segment, keyed by its rounded endpoints so rings can be joined */
  const segs = [];
  for (let y = -1; y < H; y += 1) {
    for (let x = -1; x < W; x += 1) {
      const tl = v(x, y) >= iso ? 8 : 0;
      const tr = v(x + 1, y) >= iso ? 4 : 0;
      const br = v(x + 1, y + 1) >= iso ? 2 : 0;
      const bl = v(x, y + 1) >= iso ? 1 : 0;
      const code = tl | tr | br | bl;
      const pairs = CASES[code];
      if (!pairs.length) continue;
      const edge = (id) => {
        if (id === 0) return cut(x, y, x + 1, y);
        if (id === 1) return cut(x + 1, y, x + 1, y + 1);
        if (id === 2) return cut(x, y + 1, x + 1, y + 1);
        return cut(x, y, x, y + 1);
      };
      for (const [p, q] of pairs) segs.push([edge(p), edge(q)]);
    }
  }

  // join segments end-to-end into closed rings
  const key = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
  const from = new Map();
  for (const s of segs) {
    const k = key(s[0]);
    if (!from.has(k)) from.set(k, []);
    from.get(k).push(s);
  }
  const used = new Set();
  const rings = [];
  for (const s of segs) {
    if (used.has(s)) continue;
    const ring = [s[0]];
    let cur = s;
    while (cur && !used.has(cur)) {
      used.add(cur);
      ring.push(cur[1]);
      cur = (from.get(key(cur[1])) || []).find((c) => !used.has(c));
    }
    // only genuinely closed rings: an open chain is a tracing failure, never
    // something to hand to a fill rule
    const a = ring[0];
    const b = ring[ring.length - 1];
    if (ring.length > 3 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) rings.push(ring);
  }
  return rings;
}

/**
 * Ramer-Douglas-Peucker: drops only points already on the line they sit on.
 *
 * A CLOSED ring has to be cut first. RDP anchors on the two endpoints, and on
 * a ring those are the same point - every distance to that zero-length base
 * line is zero, so a naive pass discards the whole outline. Anchoring the
 * second end on the point farthest from the start splits the ring into two
 * open runs, which is what RDP is actually defined on.
 */
export function simplify(points, epsilon) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) {
    let far = 0;
    let best = -1;
    for (let i = 1; i < points.length - 1; i += 1) {
      const d = Math.hypot(points[i][0] - first[0], points[i][1] - first[1]);
      if (d > best) {
        best = d;
        far = i;
      }
    }
    if (far < 1) return points;
    const head = rdp(points.slice(0, far + 1), epsilon);
    const tail = rdp(points.slice(far), epsilon);
    return head.concat(tail.slice(1));
  }
  return rdp(points, epsilon);
}

function rdp(points, epsilon) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    if (j <= i + 1) continue;
    const [ax, ay] = points[i];
    const [bx, by] = points[j];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let worst = -1;
    let wi = -1;
    for (let k = i + 1; k < j; k += 1) {
      const [px, py] = points[k];
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > worst) {
        worst = d;
        wi = k;
      }
    }
    if (worst > epsilon) {
      keep[wi] = 1;
      stack.push([i, wi], [wi, j]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** signed area - positive is clockwise in SVG's y-down space */
export const area = (ring) => {
  let s = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    s += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return s / 2;
};

/**
 * Rings -> one `d` attribute, mapped from source pixels into the target box.
 * Every ring is closed with `z`, so holes work through the non-zero fill rule
 * as long as their winding is opposite - which marching squares guarantees.
 */
export function toPath(rings, { scale, dx, dy, precision = 2 }) {
  // trailing zeros AFTER the point only - "10" must not become "1"
  const n = (v) =>
    v
      .toFixed(precision)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");
  return rings
    .map((ring) => {
      const pts = ring.map(([x, y]) => [x * scale + dx, y * scale + dy]);
      let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
      for (let i = 1; i < pts.length; i += 1) d += `L${n(pts[i][0])} ${n(pts[i][1])}`;
      return `${d}z`;
    })
    .join("");
}
