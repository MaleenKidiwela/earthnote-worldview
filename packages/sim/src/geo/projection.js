// ═══════════════════════════════════════════════════════════
// CATMULL-ROM SPLINE SMOOTHING
// ═══════════════════════════════════════════════════════════
export function smoothPath(points, closed, tension) {
  if (!tension) tension = 0.35;
  if (points.length < 3) {
    return "M" + points.map(function(pt) { return pt[0] + "," + pt[1]; }).join(" L") + (closed ? "Z" : "");
  }
  var pts = points.slice();
  if (closed) { pts = [points[points.length - 1]].concat(pts).concat([points[0], points[1]]); }
  else { pts = [points[0]].concat(pts).concat([points[points.length - 1]]); }
  var d = "M" + points[0][0] + "," + points[0][1];
  for (var i = 1; i < pts.length - 2; i++) {
    var p0 = pts[i-1], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2];
    d += " C" + (p1[0]+(p2[0]-p0[0])*tension).toFixed(1) + "," + (p1[1]+(p2[1]-p0[1])*tension).toFixed(1) + " " + (p2[0]-(p3[0]-p1[0])*tension).toFixed(1) + "," + (p2[1]-(p3[1]-p1[1])*tension).toFixed(1) + " " + p2[0] + "," + p2[1];
  }
  if (closed) d += "Z";
  return d;
}

// ═══════════════════════════════════════════════════════════
// GEOGRAPHIC PROJECTION — Real lat/lon → SVG coordinates
// ═══════════════════════════════════════════════════════════
// Equirectangular projection — tighter crop focused on the Salish Sea
// lonRange: -125.1 to -121.8 (3.3°), latRange: 46.9 to 49.85 (2.95°)
// viewBox: 680 × 620, center latitude 48.4°N
export var GEO = { lonMin: -125.1, latMax: 49.85, xScale: 680 / 3.3, yScale: (680 / 3.3) / Math.cos(48.4 * Math.PI / 180) };
export function proj(lon, lat) { return [(lon - GEO.lonMin) * GEO.xScale, (GEO.latMax - lat) * GEO.yScale]; }
export function projAll(coords) { return coords.map(function(c) { return proj(c[0], c[1]); }); }
