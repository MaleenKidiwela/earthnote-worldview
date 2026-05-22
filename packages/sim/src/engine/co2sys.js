// ═══════════════════════════════════════════════════════════
// CO2SYS — Seawater Carbonate Chemistry (ES5)
// ═══════════════════════════════════════════════════════════
// Standard CO2SYS algorithm for computing pH, pCO2, and
// carbonate saturation state from DIC and TA.
//
// Based on: Lewis & Wallace 1998 (original CO2SYS)
//           van Heuven et al. 2011 (MATLAB CO2SYS v2)
//           Dickson et al. 2007 (Guide to Best Practices)
//
// Equilibrium constants:
//   K1, K2: Lueker et al. 2000 (Mar. Chem. 70:105-119) — recommended by best practices
//   KB: Dickson 1990 (Deep-Sea Res. 37:755-766)
//   KW: Millero 1995 (Geochim. Cosmochim. Acta 59:661-677)
//   KSP: Mucci 1983 (Am. J. Sci. 283:780-799)
//   K0: Weiss 1974 (Mar. Chem. 2:203-215)
//   Gas transfer: Wanninkhof 2014 (Limnol. Oceanogr. Methods 12:351-362)
//
// All concentrations in µmol/kg-SW unless noted.
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

var LN10 = Math.log(10);

// ── SOLUBILITY & EQUILIBRIUM CONSTANTS ──

// K0: Henry's law CO2 solubility (mol/kg/atm) — Weiss 1974
function calcK0(TK, S) {
  var T100 = TK / 100;
  return Math.exp(
    -60.2409 + 93.4517 / T100 + 23.3585 * Math.log(T100)
    + S * (0.023517 - 0.023656 * T100 + 0.0047036 * T100 * T100)
  );
}

// K1: first dissociation of carbonic acid (mol/kg-SW) — Lueker et al. 2000
// Valid: T 2-35°C, S 19-43
function calcK1(TK, S) {
  var pK1 = 3633.86 / TK - 61.2172 + 9.6777 * Math.log(TK)
    - 0.011555 * S + 0.0001152 * S * S;
  return Math.pow(10, -pK1);
}

// K2: second dissociation of carbonic acid (mol/kg-SW) — Lueker et al. 2000
function calcK2(TK, S) {
  var pK2 = 471.78 / TK + 25.9290 - 3.16967 * Math.log(TK)
    - 0.01781 * S + 0.0001122 * S * S;
  return Math.pow(10, -pK2);
}

// KB: boric acid dissociation (mol/kg-SW) — Dickson 1990
function calcKB(TK, S) {
  var sqrtS = Math.sqrt(S);
  var lnKB = (-8966.90 - 2890.53 * sqrtS - 77.942 * S + 1.728 * S * sqrtS - 0.0996 * S * S) / TK
    + (148.0248 + 137.1942 * sqrtS + 1.62142 * S)
    + (-24.4344 - 25.085 * sqrtS - 0.2474 * S) * Math.log(TK)
    + 0.053105 * sqrtS * TK;
  return Math.exp(lnKB);
}

// KW: water dissociation (mol²/kg²-SW) — Millero 1995
function calcKW(TK, S) {
  var lnKW = 148.9802 - 13847.26 / TK - 23.6521 * Math.log(TK)
    + (-5.977 + 118.67 / TK + 1.0495 * Math.log(TK)) * Math.sqrt(S) - 0.01615 * S;
  return Math.exp(lnKW);
}

// KSP_aragonite: aragonite solubility product (mol²/kg²-SW) — Mucci 1983
function calcKspArag(TK, S) {
  var logKsp = -171.945 - 0.077993 * TK + 2903.293 / TK + 71.595 * Math.log(TK) / LN10
    + (-0.068393 + 0.0017276 * TK + 88.135 / TK) * Math.sqrt(S)
    - 0.10018 * S + 0.0059415 * S * Math.sqrt(S);
  return Math.pow(10, logKsp);
}

// KSP_calcite: calcite solubility product (mol²/kg²-SW) — Mucci 1983
function calcKspCalc(TK, S) {
  var logKsp = -171.9065 - 0.077993 * TK + 2839.319 / TK + 71.595 * Math.log(TK) / LN10
    + (-0.77712 + 0.0028426 * TK + 178.34 / TK) * Math.sqrt(S)
    - 0.07711 * S + 0.0041249 * S * Math.sqrt(S);
  return Math.pow(10, logKsp);
}

// Total boron from salinity (µmol/kg-SW) — Lee et al. 2010
function calcBT(S) {
  return 416.0 * S / 35.0; // µmol/kg
}

// Export all constants
export function solubilityConstants(temp, salinity) {
  var TK = temp + 273.15;
  var S = salinity;
  return {
    K0: calcK0(TK, S),
    K1: calcK1(TK, S),
    K2: calcK2(TK, S),
    KB: calcKB(TK, S),
    KW: calcKW(TK, S),
    KSP_arag: calcKspArag(TK, S),
    KSP_calc: calcKspCalc(TK, S),
    BT: calcBT(S),
  };
}

// ── pH SOLVER (Newton-Raphson) ──
// Finds [H+] given DIC (µmol/kg), TA (µmol/kg), and equilibrium constants.
// Returns pH on total scale.
function solvePH(DIC, TA, K1, K2, KB, KW, BT) {
  // Initial guess: pH ~8.0
  var H = 1e-8; // [H+] in mol/kg
  var DICmol = DIC * 1e-6; // convert µmol/kg to mol/kg
  var TAmol = TA * 1e-6;
  var BTmol = BT * 1e-6;

  for (var iter = 0; iter < 20; iter++) {
    var H2 = H * H;
    var denom = H2 + K1 * H + K1 * K2;
    // Carbonate alkalinity
    var HCO3 = DICmol * K1 * H / denom;
    var CO3 = DICmol * K1 * K2 / denom;
    var CAlk = HCO3 + 2 * CO3;
    // Borate alkalinity
    var BAlk = BTmol * KB / (H + KB);
    // Water
    var OH = KW / H;
    // Total alkalinity residual
    var F = CAlk + BAlk + OH - H - TAmol;

    // Derivative dF/dH
    var dCAlk_dH = DICmol * K1 * (H2 - K1 * K2) / (denom * denom);
    var dBAlk_dH = -BTmol * KB / ((H + KB) * (H + KB));
    var dOH_dH = -KW / (H * H);
    var dF = dCAlk_dH + dBAlk_dH + dOH_dH - 1;

    // Newton step
    var step = F / dF;
    H = H - step;
    if (H <= 0) H = 1e-10; // prevent negative

    // Convergence check
    if (Math.abs(step / H) < 1e-8) break;
  }

  return -Math.log10(Math.max(H, 1e-14));
}

// ── MAIN CO2SYS CALCULATION ──
// Input: DIC (µmol/kg), TA (µmol/kg), temp (°C), salinity (PSU)
// Output: { pH, pCO2, omegaArag, omegaCalc, CO3, HCO3, CO2star }
export function co2sysCalc(DIC, TA, temp, salinity) {
  var TK = temp + 273.15;
  var S = salinity;

  // Guard inputs
  if (DIC <= 0 || TA <= 0 || S <= 0) {
    return { pH: 8.0, pCO2: 400, omegaArag: 2.0, omegaCalc: 3.0, CO3: 100, HCO3: 1700, CO2star: 12 };
  }

  var K0 = calcK0(TK, S);
  var K1 = calcK1(TK, S);
  var K2 = calcK2(TK, S);
  var KB = calcKB(TK, S);
  var KW = calcKW(TK, S);
  var KSP_arag = calcKspArag(TK, S);
  var KSP_calc = calcKspCalc(TK, S);
  var BT = calcBT(S);

  // Solve for pH
  var pH = solvePH(DIC, TA, K1, K2, KB, KW, BT);
  var H = Math.pow(10, -pH);

  // Compute speciation (mol/kg)
  var DICmol = DIC * 1e-6;
  var H2 = H * H;
  var denom = H2 + K1 * H + K1 * K2;

  var CO2star = DICmol * H2 / denom; // mol/kg
  var HCO3 = DICmol * K1 * H / denom;
  var CO3 = DICmol * K1 * K2 / denom;

  // pCO2 (µatm)
  var pCO2 = K0 > 0 ? CO2star / K0 * 1e6 : 400; // convert atm to µatm

  // Saturation states
  var Ca = 0.01028 * S / 35; // mol/kg — calcium concentration (conservative)
  var omegaArag = Ca * CO3 / KSP_arag;
  var omegaCalc = Ca * CO3 / KSP_calc;

  return {
    pH: pH,
    pCO2: pCO2, // µatm
    omegaArag: omegaArag, // dimensionless
    omegaCalc: omegaCalc,
    CO3: CO3 * 1e6, // µmol/kg
    HCO3: HCO3 * 1e6,
    CO2star: CO2star * 1e6,
  };
}

// ── AIR-SEA CO2 FLUX ──
// Wanninkhof 2014 parameterization
// Returns flux in mol/m²/month (positive = outgassing)
export function airSeaCO2Flux(pCO2_ocean, pCO2_atm, temp, salinity, windSpeed) {
  var TK = temp + 273.15;
  var T = temp;

  // K0: Henry's law solubility (mol/kg/atm) — Weiss 1974
  var K0 = calcK0(TK, salinity);

  // Schmidt number for CO2 in seawater — Wanninkhof 2014 (Table 1)
  var Sc = 2116.8 - 136.25 * T + 4.7353 * T * T - 0.092307 * T * T * T + 0.0007555 * T * T * T * T;

  // Gas transfer velocity k (cm/hr) — Wanninkhof 2014 Eq. 3
  // k = 0.251 * u² * (Sc/660)^(-0.5)
  var u = windSpeed || 5; // m/s default (moderate wind)
  var k = 0.251 * u * u * Math.pow(Sc / 660, -0.5); // cm/hr

  // Convert k to m/month: cm/hr × (1m/100cm) × (24hr/day) × (30.44 day/month)
  var k_m_month = k * 0.01 * 24 * 30.44;

  // ΔpCO2 in atm
  var dpCO2 = (pCO2_ocean - pCO2_atm) * 1e-6; // µatm to atm

  // Flux = k × K0 × ΔpCO2 (mol/m²/month)
  // K0 in mol/kg/atm, but seawater density ~1025 kg/m³
  var rho = 1025; // kg/m³ seawater density
  var flux = k_m_month * K0 * rho * dpCO2;

  return flux; // mol/m²/month — positive = ocean loses CO2 (outgassing)
}

// ── BENCHMARK VALUES ──
// For validation against Dickson et al. 2007 (Guide to Best Practices)
export var CO2SYS_BENCHMARKS = [
  { label: 'Standard seawater', temp: 25, sal: 35, DIC: 2000, TA: 2300,
    expected: { pH_min: 8.02, pH_max: 8.12, omega_min: 2.2, omega_max: 3.5, pCO2_min: 300, pCO2_max: 420 } },
  { label: 'Cold Salish Sea', temp: 10, sal: 30, DIC: 2100, TA: 2200,
    expected: { pH_min: 7.80, pH_max: 7.95, omega_min: 1.0, omega_max: 2.0 } },
  { label: 'Acidified (high DIC)', temp: 10, sal: 30, DIC: 2300, TA: 2100,
    expected: { pH_min: 7.45, pH_max: 7.70, omega_min: 0.2, omega_max: 0.9 } },
];
