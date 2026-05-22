import { cl } from '../engine/utils.js';

export var METRICS = {
  DO:{ label:"Dissolved O₂", unit:"mg/L", min:3, max:10, colors:["#8B0000","#CC4400","#E8A735","#7FB069","#2D7A4F"] },
  SST:{ label:"Temperature", unit:"°C", min:8, max:16, colors:["#2166AC","#67A9CF","#FDDBC7","#EF8A62","#B2182B"] },
  pH:{ label:"pH", unit:"", min:7.5, max:8.2, colors:["#8B0000","#CC4400","#F0E68C","#7FB069","#2D7A4F"] },
  wqi:{ label:"Water Quality", unit:"idx", min:0.3, max:0.9, colors:["#8B0000","#CC4400","#E8A735","#7FB069","#2D7A4F"] },
  habIntensity:{ label:"HAB Risk", unit:"", min:0, max:0.8, colors:["#2D7A4F","#7FB069","#F0E68C","#CC4400","#8B0000"] },
};
export function metricColor(val, metric) {
  var m = METRICS[metric]; if (!m) return "rgba(100,160,220,0.15)";
  var t = cl((val-m.min)/(m.max-m.min),0,1), idx = t*(m.colors.length-1);
  var lo = Math.floor(idx), hi = Math.min(lo+1,m.colors.length-1), f = idx-lo;
  function h2r(h) { return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
  var c1 = h2r(m.colors[lo]), c2 = h2r(m.colors[hi]);
  return "rgba("+Math.round(c1[0]+(c2[0]-c1[0])*f)+","+Math.round(c1[1]+(c2[1]-c1[1])*f)+","+Math.round(c1[2]+(c2[2]-c1[2])*f)+",0.28)";
}
