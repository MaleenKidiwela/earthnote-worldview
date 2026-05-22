function computeRiskList(r) {
  var ms = r.marine.state, es = r.ecosystem.state, us = r.urban.state, ps = r.port.state, ws = r.watershed.state;
  var ns = r.energy ? r.energy.state : {};
  var _v = function(val, fb) { return val !== undefined ? val : fb; };
  var risks = [];
  // ── CRITICAL ──
  if (ms.dissolvedOxygen < 6) risks.push({ text: "Low dissolved oxygen (" + ms.dissolvedOxygen.toFixed(1) + " mg/L) — fish kills possible", sev: "critical" });
  if (_v(es.orcaPopulation, 74) < 70) risks.push({ text: "SRKW orca below 70 individuals — emergency threshold", sev: "critical" });
  if (_v(es.orcaPopulation, 74) < 30) risks.push({ text: "SRKW population below 30 — Allee effect accelerating decline, inbreeding depression severe, functional extinction imminent", sev: "critical" });
  if (_v(es.orcaPopulation, 74) < 10) risks.push({ text: "SRKW FUNCTIONALLY EXTINCT — fewer than 10 individuals, recovery no longer possible without extraordinary intervention", sev: "critical" });
  // Per-pod demographic stochasticity risks (Lacy et al. 2017)
  var _kPop = es.orcaPods && es.orcaPods.K ? es.orcaPods.K.population : 14;
  var _jPop = es.orcaPods && es.orcaPods.J ? es.orcaPods.J.population : 27;
  var _lPop = es.orcaPods && es.orcaPods.L ? es.orcaPods.L.population : 33;
  if (_kPop < 1) risks.push({ text: "K Pod functionally extinct — demographic stochasticity and Allee effects have eliminated the pod", sev: "critical" });
  else if (_kPop < 10) risks.push({ text: "K Pod critically small (" + Math.round(_kPop) + " individuals) — demographic stochasticity threatens viability", sev: "critical" });
  if (_jPop < 8) risks.push({ text: "J Pod below minimum viable size (" + Math.round(_jPop) + " individuals) — Allee effect active", sev: "critical" });
  if (_lPop < 8) risks.push({ text: "L Pod below minimum viable size (" + Math.round(_lPop) + " individuals) — Allee effect active", sev: "critical" });
  if (_kPop >= 10 && _kPop < 12) risks.push({ text: "K Pod near Allee threshold (" + Math.round(_kPop) + " individuals) — inbreeding depression risk rising", sev: "warning" });
  if (es.salmonRunStrength < 20) risks.push({ text: "Salmon runs at " + es.salmonRunStrength.toFixed(0) + "/100 — treaty obligations at risk", sev: "critical" });
  if (es.salmonRunStrength >= 20 && es.salmonRunStrength < 30) risks.push({ text: "Salmon runs low (" + es.salmonRunStrength.toFixed(0) + "/100) — seasonal low or early decline signal", sev: "warning" });
  if (_v(es.ceremonialAccess, 0.6) < 0.3) risks.push({ text: "Ceremonial salmon access critically impaired (" + (_v(es.ceremonialAccess, 0.6)*100).toFixed(0) + "%) — chinook returns insufficient for First Salmon ceremonies, run timing shifted", sev: "critical" });
  if (_v(es.indigenousFoodSovereignty, 0.6) < 0.3) risks.push({ text: "Indigenous food sovereignty failing (" + (_v(es.indigenousFoodSovereignty, 0.6)*100).toFixed(0) + "%) — multiple traditional food sources simultaneously compromised", sev: "critical" });
  if (r.mhw && r.mhw.active) risks.push({ text: "Marine heat wave — +" + _v(r.mhw.sstAnomaly, 0).toFixed(1) + "°C anomaly, " + _v(r.mhw.remaining, 0) + " quarters remaining. Kelp mortality, salmon crash, HAB intensification expected", sev: "critical" });
  if (_v(es.eelgrassEstablishment, 0.7) < 0.3) risks.push({ text: "Eelgrass regime shift — root establishment at " + (_v(es.eelgrassEstablishment, 0.7)*100).toFixed(0) + "%. Seedbank depleted, recovery functionally impossible", sev: "critical" });
  if (_v(es.greenCrabPop, 0) > 0.5) risks.push({ text: "Green crab invasion severe — " + (_v(es.greenCrabPop, 0)*100).toFixed(0) + "% density, destroying eelgrass and shellfish", sev: "critical" });
  if (_v(ws.glacialMass, 1) < 0.2) risks.push({ text: "Glacial retreat critical — " + (_v(ws.glacialMass, 1)*100).toFixed(0) + "% mass remaining. Summer baseflow collapse underway", sev: "critical" });
  if (_v(ws.groundwaterLevel, 0.7) < 0.3) risks.push({ text: "Groundwater critically low (" + (_v(ws.groundwaterLevel, 0.7)*100).toFixed(0) + "%) — saltwater intrusion via aquifer, subsidence amplifying SLR", sev: "critical" });
  if (_v(ms.minOmegaAragonite, 2.0) < 1.0) risks.push({ text: "Aragonite undersaturation (Omega=" + _v(ms.minOmegaAragonite, 2.0).toFixed(2) + ") — shell dissolution active, shellfish industry collapse risk", sev: "critical" });
  if (_v(es.dungenessCrabPop, 0.65) < 0.3) risks.push({ text: "Dungeness crab below minimum stock (" + (_v(es.dungenessCrabPop, 0.65)*100).toFixed(0) + "%) — fishery closure, $250M/yr industry at risk", sev: "critical" });
  if (_v(es.olympiaOysterPop, 0.08) < 0.02) risks.push({ text: "Olympia oyster functionally extinct (" + (_v(es.olympiaOysterPop, 0.08)*100).toFixed(0) + "%) — native shellfish cannot recover without active restoration", sev: "critical" });
  if (_v(es.rockfishPop, 0.08) < 0.03) risks.push({ text: "Rockfish at " + (_v(es.rockfishPop, 0.08)*100).toFixed(0) + "% of historical — extirpation risk, MPA recovery requires 30+ years", sev: "critical" });
  if (_v(es.forageFishIndex, 0.45) < 0.2) risks.push({ text: "Forage fish collapse (" + (_v(es.forageFishIndex, 0.45)*100).toFixed(0) + "%) — seabirds, salmon, and orca prey base failing", sev: "critical" });
  if (_v(es.murreletPop, 0.25) < 0.08) risks.push({ text: "Marbled murrelet near extirpation (" + (_v(es.murreletPop, 0.25)*100).toFixed(0) + "%) — old-growth nesting loss + forage fish collapse", sev: "critical" });
  if (_v(es.urchinGrazing, 0) > 0.35) risks.push({ text: "Urchin barrens forming — grazing pressure " + (_v(es.urchinGrazing, 0)*100).toFixed(0) + "%, kelp canopy being eliminated", sev: "critical" });
  if (_v(us.propertyValueIndex, 0.7) < 0.4) risks.push({ text: "Property values collapsing (" + (_v(us.propertyValueIndex, 0.7)*100).toFixed(0) + "%) — tax revenue declining, infrastructure decay spiral active", sev: "critical" });
  if (_v(us.infraDecay, 0) > 0.2) risks.push({ text: "Infrastructure decay spiral — " + (_v(us.infraDecay, 0)*100).toFixed(0) + "% additional aging from underfunding. Effective infra age " + (_v(us.effectiveInfraAge, 0.55)*100).toFixed(0) + "%", sev: _v(us.infraDecay, 0) > 0.3 ? "critical" : "warning" });
  if (_v(us.insurancePremiumIndex, 1) > 2.0) risks.push({ text: "Insurance crisis — premiums " + (_v(us.insurancePremiumIndex, 1)).toFixed(1) + "× baseline, coverage withdrawal beginning in flood zones", sev: _v(us.insurancePremiumIndex, 1) > 2.5 ? "critical" : "warning" });
  if (_v(us.coverageWithdrawal, 0) > 0.2) risks.push({ text: "Insurance market failure — " + (_v(us.coverageWithdrawal, 0)*100).toFixed(0) + "% of high-risk zones losing coverage (analog to CA fire/FL hurricane crisis)", sev: "critical" });
  if (_v(es.phenoMismatchIndex, 0) > 0.25) risks.push({ text: "Severe phenological mismatch — salmon smolt outmigration decoupled from zooplankton availability", sev: "critical" });
  // ── WARNING ──
  if (_v(es.contamAdvisoryImpact, 0.1) > 0.5) risks.push({ text: "Contamination advisories restricting traditional food harvest — PCB/PFAS burden forcing choice between cultural practice and health", sev: _v(es.contamAdvisoryImpact, 0.1) > 0.7 ? "critical" : "warning" });
  // Disaggregated emerging pollutant risk flags
  if (_v(ms.pfas, 0.05) > 0.15) risks.push({ text: "PFAS accumulating (" + (_v(ms.pfas, 0.05)*100).toFixed(0) + "%) — forever chemicals in food web, military base firefighting foam a major source", sev: _v(ms.pfas, 0.05) > 0.3 ? "critical" : "warning" });
  if (_v(ms.microplastics, 0.08) > 0.20) risks.push({ text: "Microplastic levels rising (" + (_v(ms.microplastics, 0.08)*100).toFixed(0) + "%) — tire wear, clothing fibers, and degraded debris accumulating in all basins", sev: _v(ms.microplastics, 0.08) > 0.4 ? "critical" : "warning" });
  if (_v(ms.pcb, 0.12) > 0.25) risks.push({ text: "PCB levels elevated (" + (_v(ms.pcb, 0.12)*100).toFixed(0) + "%) — legacy contamination bioaccumulating in orca and salmon. Duwamish Superfund cleanup critical", sev: _v(ms.pcb, 0.12) > 0.4 ? "critical" : "warning" });
  // 6PPD-quinone coho mortality (Tian et al. 2021)
  var mainContam = r.contaminants && r.contaminants.mainBasin ? r.contaminants.mainBasin : {};
  var sixPPDqLevel = mainContam.sixPPDq || 0;
  if (sixPPDqLevel > 0.8) risks.push({ text: "6PPD-quinone lethal to coho (" + sixPPDqLevel.toFixed(1) + " \u00B5g/L) \u2014 tire-derived toxin killing pre-spawn adults in urban streams. Stormwater treatment urgent", sev: "critical" });
  else if (sixPPDqLevel > 0.3) risks.push({ text: "6PPD-quinone approaching coho threshold (" + sixPPDqLevel.toFixed(1) + " \u00B5g/L) \u2014 tire wear runoff stressing salmon in urbanized watersheds", sev: "warning" });
  // Wastewater capacity stress
  var wwLoad = mainContam.wastewater || {};
  if (wwLoad.capacityStress > 0.2) risks.push({ text: "Wastewater treatment near capacity \u2014 population growth outpacing plant upgrades, CSO overflow risk elevated", sev: wwLoad.capacityStress > 0.35 ? "critical" : "warning" });
  if (wwLoad.csoEvents > 2) risks.push({ text: "CSO overflow events (" + Math.round(wwLoad.csoEvents) + "/quarter) \u2014 untreated sewage entering marine waters", sev: wwLoad.csoEvents > 4 ? "critical" : "warning" });
  if (_v(es.phenoMismatchIndex, 0) > 0.15 && _v(es.phenoMismatchIndex, 0) <= 0.25) risks.push({ text: "Seasonal timing disrupted — spring bloom and species phenology shifting at different rates", sev: "warning" });
  if (_v(es.climateDisplacementRisk, 0.1) > 0.5) risks.push({ text: "Climate displacement eroding place-based traditional knowledge — species shifting northward, run timing advancing", sev: _v(es.climateDisplacementRisk, 0.1) > 0.7 ? "critical" : "warning" });
  if (_v(es.treatyFisheryHealth, 0.5) < 0.4 && _v(es.treatyFisheryHealth, 0.5) >= 0.2) risks.push({ text: "Treaty fishery health declining (" + (_v(es.treatyFisheryHealth, 0.5)*100).toFixed(0) + "%) — increase co-management investment", sev: "warning" });
  if (_v(us.coastalFloodRisk, 0) > 0.3) risks.push({ text: "Coastal flood risk elevated — ~" + Math.round(_v(us.coastalFloodRisk, 0) * 45000 / 1000) + "k properties exposed", sev: "warning" });
  if (us.csoFrequency > 6) risks.push({ text: "Sewage overflows " + us.csoFrequency.toFixed(1) + "/quarter — exceeds EPA targets", sev: "warning" });
  if (ms.pH < 7.8) risks.push({ text: "Ocean acidification (pH " + ms.pH.toFixed(2) + ") — shellfish industry impacts", sev: "warning" });
  if (_v(ms.maxAlexandrium, 0) > 0.3) risks.push({ text: "PSP alert — Alexandrium bloom (" + (_v(ms.maxAlexandrium, 0)*100).toFixed(0) + "%), saxitoxin in shellfish, harvest closures active", sev: _v(ms.maxAlexandrium, 0) > 0.6 ? "critical" : "warning" });
  if (_v(ms.maxPseudoNitzschia, 0) > 0.25) risks.push({ text: "ASP alert — Pseudo-nitzschia bloom (" + (_v(ms.maxPseudoNitzschia, 0)*100).toFixed(0) + "%), domoic acid in shellfish and fish, marine mammal strandings possible", sev: _v(ms.maxPseudoNitzschia, 0) > 0.5 ? "critical" : "warning" });
  if (_v(ms.maxPseudoNitzschia, 0) > 0.5 && _v(es.pinnipedPop, 40000) > 30000) risks.push({ text: "Marine mammal strandings — domoic acid bioaccumulating through fish into pinnipeds", sev: "warning" });
  if (_v(us.waterStress, 0) > 0.3) risks.push({ text: "Water supply stress at " + (_v(us.waterStress, 0) * 100).toFixed(0) + "% — summer restrictions likely", sev: "warning" });
  if (_v(es.eelgrassEstablishment, 0.7) >= 0.3 && _v(es.eelgrassEstablishment, 0.7) < 0.45) risks.push({ text: "Eelgrass declining — establishment at " + (_v(es.eelgrassEstablishment, 0.7)*100).toFixed(0) + "%, approaching regime shift threshold (30%)", sev: "warning" });
  if (_v(es.greenCrabPop, 0) > 0.25 && _v(es.greenCrabPop, 0) <= 0.5) risks.push({ text: "Green crab population expanding — " + (_v(es.greenCrabPop, 0)*100).toFixed(0) + "% density, eelgrass damage increasing", sev: "warning" });
  if (_v(ws.glacialMass, 1) >= 0.2 && _v(ws.glacialMass, 1) < 0.5) risks.push({ text: "Glacial mass at " + (_v(ws.glacialMass, 1)*100).toFixed(0) + "% — summer water supply declining, peak water transition", sev: "warning" });
  if (_v(ws.groundwaterLevel, 0.7) >= 0.3 && _v(ws.groundwaterLevel, 0.7) < 0.5) risks.push({ text: "Groundwater declining (" + (_v(ws.groundwaterLevel, 0.7)*100).toFixed(0) + "%) — reduced summer baseflow", sev: "warning" });
  if (_v(ws.snowpack, 180) < 50) risks.push({ text: "Snowpack critically low (" + _v(ws.snowpack, 180).toFixed(0) + " mm SWE) — weak freshet expected", sev: "warning" });
  if (_v(ws.activeBurnScar, 0) > 0.3) risks.push({ text: "Burn scar active (" + (_v(ws.activeBurnScar, 0)*100).toFixed(0) + "%) — amplified runoff and sediment", sev: _v(ws.activeBurnScar, 0) > 0.5 ? "critical" : "warning" });
  if (_v(ws.arCategory, 0) >= 4) risks.push({ text: "Atmospheric river AR" + _v(ws.arCategory, 0) + " — catastrophic flooding, massive sediment mobilization", sev: "critical" });
  if (_v(ws.arCategory, 0) === 3) risks.push({ text: "Atmospheric river AR3 — significant flood risk, elevated sediment and nutrient loading", sev: "warning" });
  if (_v(ws.arCategory, 0) >= 4 && _v(ws.activeBurnScar, 0) > 0.2) risks.push({ text: "Compound event: AR" + _v(ws.arCategory, 0) + " + burn scar — extreme debris flow risk", sev: "critical" });
  if (_v(ms.omegaAragonite, 2.0) >= 1.0 && _v(ms.omegaAragonite, 2.0) < 1.5) risks.push({ text: "Aragonite saturation declining (Omega=" + _v(ms.omegaAragonite, 2.0).toFixed(2) + ") — shellfish larvae stressed", sev: "warning" });
  if (_v(ms.tidalExtraction, 0) > 0.4 && ms.pugetSoundDO < 5) risks.push({ text: "Tidal energy extraction reducing mixing — Hood Canal DO at " + ms.pugetSoundDO.toFixed(1) + " mg/L", sev: "warning" });
  if (_v(ms.tidalExtraction, 0) > 0.4 && _v(ms.hoodCanalDeepDO, 3.5) < 3) risks.push({ text: "Tidal extraction reducing ventilation — Hood Canal deep DO at " + _v(ms.hoodCanalDeepDO, 3.5).toFixed(1) + " mg/L, extraction impeding renewal", sev: "warning" });
  if (_v(es.dungenessCrabPop, 0.65) >= 0.3 && _v(es.dungenessCrabPop, 0.65) < 0.45) risks.push({ text: "Dungeness crab declining (" + (_v(es.dungenessCrabPop, 0.65)*100).toFixed(0) + "%) — hypoxia and green crab predation impacting recruitment", sev: "warning" });
  if (_v(es.pacificOysterPop, 0.50) < 0.25) risks.push({ text: "Pacific oyster population at " + (_v(es.pacificOysterPop, 0.50)*100).toFixed(0) + "% — ocean acidification impairing larval shell formation (Ω=" + _v(ms.omegaAragonite, 2.0).toFixed(2) + ")", sev: "warning" });
  if (_v(es.surfSmeltPop, 0.50) < 0.25) risks.push({ text: "Surf smelt declining (" + (_v(es.surfSmeltPop, 0.50)*100).toFixed(0) + "%) — upper-beach spawning habitat lost to shoreline armoring", sev: "warning" });
  if (_v(es.sandLancePop, 0.55) < 0.25) risks.push({ text: "Sand lance declining (" + (_v(es.sandLancePop, 0.55)*100).toFixed(0) + "%) — subtidal sandy habitat disturbed by dredging and contamination", sev: "warning" });
  if (_v(es.murreletPop, 0.25) >= 0.08 && _v(es.murreletPop, 0.25) < 0.15) risks.push({ text: "Marbled murrelet at " + (_v(es.murreletPop, 0.25)*100).toFixed(0) + "% — federally threatened, needs old-growth forest + forage fish recovery", sev: "warning" });
  if (_v(es.geoduckPop, 0.40) < 0.20) risks.push({ text: "Geoduck declining (" + (_v(es.geoduckPop, 0.40)*100).toFixed(0) + "%) — contamination bioaccumulation threatening $80M/yr export market", sev: "warning" });
  if (_v(es.humpOrcaCompetition, 0) > 0.04) risks.push({ text: "Humpback-orca competition intensifying — " + (_v(es.humpOrcaCompetition, 0)*100).toFixed(0) + "% prey reduction for SRKW from recovering humpbacks", sev: "warning" });
  if (_v(es.urchinPop, 0.45) > 0.55) risks.push({ text: "Sea urchin population rising (" + (_v(es.urchinPop, 0.45)*100).toFixed(0) + "%) — approaching barren threshold (60%), predator decline suspected", sev: "warning" });
  if (_v(es.jellyfishPop, 0.15) > 0.4) risks.push({ text: "Jellyfish bloom (" + (_v(es.jellyfishPop, 0.15)*100).toFixed(0) + "%) — competing with larval fish for zooplankton, ecosystem jellification risk", sev: _v(es.jellyfishPop, 0.15) > 0.6 ? "critical" : "warning" });
  if (_v(es.porpoisePop, 0.55) < 0.25) risks.push({ text: "Harbor porpoise declining (" + (_v(es.porpoisePop, 0.55)*100).toFixed(0) + "%) — acoustic disturbance driving habitat abandonment", sev: "warning" });
  if (_v(es.lampreyPop, 0.20) < 0.10) risks.push({ text: "Pacific lamprey near extirpation (" + (_v(es.lampreyPop, 0.20)*100).toFixed(0) + "%) — passage barriers + sedimentation, tribal ceremony food at risk", sev: "critical" });
  if (_v(es.seaOtterPop, 0) > 0.1) risks.push({ text: "Sea otters recolonizing (" + (_v(es.seaOtterPop, 0)*100).toFixed(0) + "%) — kelp recovery accelerating but crab/geoduck fisheries impacted", sev: "info" });
  if (_v(es.cherryPointHerring, 0.06) < 0.03) risks.push({ text: "Cherry Point herring near collapse (" + (_v(es.cherryPointHerring, 0.06)*100).toFixed(0) + "%) — critical Lummi Nation treaty fishery, largest spring-spawning stock", sev: "critical" });
  if (_v(es.cherryPointHerring, 0.06) >= 0.03 && _v(es.cherryPointHerring, 0.06) < 0.08) risks.push({ text: "Cherry Point herring severely depleted (" + (_v(es.cherryPointHerring, 0.06)*100).toFixed(0) + "%) — ~97% below historic peak, Allee effect risk for schooling fish", sev: "warning" });
  if (_v(ms.hoodCanalBenthicLoad, 60) > 120) risks.push({ text: "Hood Canal benthic load at " + _v(ms.hoodCanalBenthicLoad, 60).toFixed(0) + " — persistent SOD, hypoxia will persist even after nutrient reduction", sev: _v(ms.hoodCanalBenthicLoad, 60) > 150 ? "critical" : "warning" });
  // ── HOOD CANAL 2-LAYER FJORD RISKS ──
  if (_v(ms.hoodCanalDeepDO, 3.5) < 1.0) risks.push({ text: "Hood Canal approaching anoxia (" + _v(ms.hoodCanalDeepDO, 3.5).toFixed(1) + " mg/L) — fish kills possible", sev: "critical" });
  if (_v(ms.hoodCanalDeepDO, 3.5) >= 1.0 && _v(ms.hoodCanalDeepDO, 3.5) < 2.0) risks.push({ text: "Hood Canal deep water hypoxic (" + _v(ms.hoodCanalDeepDO, 3.5).toFixed(1) + " mg/L) — benthic organisms stressed", sev: "warning" });
  if (_v(ms.hoodCanalRenewal, 0) > 0) risks.push({ text: "Hood Canal deep water renewal event — temporary oxygen recovery in progress", sev: "info" });
  if (_v(ms.hoodCanalStratification, 0.5) > 0.7) risks.push({ text: "Hood Canal strongly stratified (" + (_v(ms.hoodCanalStratification, 0.5)*100).toFixed(0) + "%) — deep hypoxia persisting", sev: "warning" });
  if (_v(es.aquacultureIntensity, 0.3) > 0.6) risks.push({ text: "Aquaculture intensity at " + (_v(es.aquacultureIntensity, 0.3)*100).toFixed(0) + "% — Georgia Strait water quality degrading, sea lice pressure " + (_v(es.seaLicePressure, 0)*100).toFixed(0) + "% on wild smolts", sev: "warning" });
  if (_v(es.aquacultureIntensity, 0.3) > 0.4 && _v(es.aquacultureIntensity, 0.3) <= 0.6) risks.push({ text: "Sea lice from open-pen farms reducing wild salmon smolt survival by " + (_v(es.seaLicePressure, 0)*100).toFixed(0) + "%", sev: "warning" });
  // ── UPWELLING / PACIFIC SOURCE WATER ──
  if (_v(ms.upwellingIndex, 0) > 0.6 && _v(ms.pacificSourcepH, 7.65) < 7.60) risks.push({ text: "Corrosive deep water entering Salish Sea — upwelling pumping acidified Pacific water (pH " + _v(ms.pacificSourcepH, 7.65).toFixed(2) + ") through Juan de Fuca", sev: "warning" });
  if (_v(ms.upwellingIndex, 0) > 0.7 && _v(ms.pacificSourceDO, 2.0) < 1.5) risks.push({ text: "Hypoxic Pacific water entering via upwelling — deep water DO " + _v(ms.pacificSourceDO, 2.0).toFixed(1) + " mg/L declining system-wide", sev: "critical" });
  // ── GEOLOGICAL HAZARD RISK FLAGS ──
  if (_v(ms.maxQuakeSediment, 0) > 20) risks.push({ text: "Post-earthquake sediment pulse — turbidity elevated, recovery in progress (" + _v(ms.maxQuakeSediment, 0).toFixed(0) + " NTU excess)", sev: _v(ms.maxQuakeSediment, 0) > 40 ? "critical" : "warning" });
  if (_v(ms.earthquakeActive, 0) > 0.8 && _v(ms.maxQuakeSediment, 0) > 30) risks.push({ text: "Submarine landslides detected — basin turbidity spiking, deep DO depressed", sev: "critical" });
  // ── COASTAL GEOMORPHOLOGY ──
  if (_v(es.coastalSqueeze, 0) > 0.2) risks.push({ text: "Coastal squeeze — armored beaches narrowing under SLR, forage fish spawning habitat shrinking", sev: _v(es.coastalSqueeze, 0) > 0.35 ? "critical" : "warning" });
  if (_v(es.beachHealth, 0.5) < 0.4) risks.push({ text: "Beach sediment starvation (" + (_v(es.beachHealth, 0.5)*100).toFixed(0) + "%) — forage fish spawning critically reduced by armoring and reduced bluff erosion", sev: _v(es.beachHealth, 0.5) < 0.25 ? "critical" : "warning" });
  if (_v(ps.invasivePressure, 0) > 0.4) risks.push({ text: "Ballast water invasive pressure at " + (_v(ps.invasivePressure, 0)*100).toFixed(0) + "% — increase treatment compliance", sev: "warning" });
  if (_v(es.pinnipedPredation, 0) > 0.15) risks.push({ text: "Pinniped predation pressure at " + (_v(es.pinnipedPredation, 0)*100).toFixed(0) + "% — " + Math.round(_v(es.pinnipedPop, 40000)).toLocaleString() + " seals/sea lions reducing salmon smolt survival", sev: "warning" });
  // ── BIGG'S (TRANSIENT) KILLER WHALE ──
  var _biggsPop = _v(es.biggsOrcaPop, 0.80);
  if (_biggsPop < 0.20) risks.push({ text: "Bigg's orca population at " + Math.round(_biggsPop * 500) + " individuals — prey depletion or PCB burden threatening population", sev: "critical" });
  if (_biggsPop < 0.40 && _biggsPop >= 0.20) risks.push({ text: "Bigg's orca declining (" + Math.round(_biggsPop * 500) + " individuals) — pinniped prey base insufficient", sev: "warning" });
  if (_v(es.biggsPCBBurden, 0) > 0.5) risks.push({ text: "Bigg's orca PCB burden extreme (" + (_v(es.biggsPCBBurden, 0)*100).toFixed(0) + "%) — among most contaminated marine mammals on Earth, reproductive failure risk", sev: _v(es.biggsPCBBurden, 0) > 0.7 ? "critical" : "warning" });
  // ── PTEROPOD (Ocean Acidification) ──
  var _pterPop = _v(es.pteropodPop, 0.65);
  if (_pterPop < 0.20) risks.push({ text: "Pteropod population collapsed (" + (_pterPop*100).toFixed(0) + "%) — aragonite shell dissolution from ocean acidification. Juvenile salmon prey base failing (Bednaršek et al. 2014)", sev: "critical" });
  if (_pterPop < 0.35 && _pterPop >= 0.20) risks.push({ text: "Pteropod decline (" + (_pterPop*100).toFixed(0) + "%) — shell stress from low aragonite saturation, juvenile salmon prey reduced", sev: "warning" });
  // ── GRAY WHALE ──
  if (_v(es.grayWhalePop, 0.30) < 0.10) risks.push({ text: "Gray whale population critically low (" + Math.round(_v(es.grayWhalePop, 0.30) * 100) + " individuals) — benthic prey depletion or vessel strikes", sev: "critical" });
  if (_v(es.grayWhalePop, 0.30) < 0.20 && _v(es.grayWhalePop, 0.30) >= 0.10) risks.push({ text: "Gray whale declining (" + Math.round(_v(es.grayWhalePop, 0.30) * 100) + " individuals) — unusual mortality event possible", sev: "warning" });
  if (_v(ws.airQuality, 0.85) < 0.6) risks.push({ text: "Degraded air quality — respiratory health impacts", sev: "warning" });
  if (_v(ps.supplyChainEff, 1) < 0.7) risks.push({ text: "Supply chain disruption — port throughput reduced", sev: "warning" });
  // ── SLR ADAPTATION STRATEGY ──
  if (_v(es.slrStrategy, 1) === 0 && _v(es.surfSmeltPop, 0.50) < 0.35) risks.push({ text: "Hard armoring destroying surf smelt spawning habitat (" + (_v(es.surfSmeltPop, 0.50)*100).toFixed(0) + "%) — seawalls eliminate upper-beach gravel needed for egg deposition", sev: "warning" });
  if (_v(es.slrStrategy, 1) === 1 && _v(us.coastalFloodRisk, 0) > 0.4) risks.push({ text: "No SLR adaptation strategy — coastal flood risk at " + (_v(us.coastalFloodRisk, 0)*100).toFixed(0) + "% with status quo approach. Consider hard armoring or living shorelines", sev: "warning" });
  if (_v(es.slrStrategy, 1) === 2) risks.push({ text: "Living shorelines active — oyster reefs and eelgrass buffers reducing flood risk while restoring habitat. Property values may decline in managed retreat zones", sev: "info" });
  // ── ENERGY & GRID ──
  // ── CLIMATE DISPLACEMENT & SOCIAL STABILITY ──
  var _totalDisp = _v(us.totalDisplaced, 0);
  var _tribalDisp = _v(us.tribalDisplaced, 0);
  var _socStab = _v(us.socialStability, 1);
  var _dispPressure = _v(us.displacementPressure, 0);
  var _relocCost = _v(us.relocationCostEstimate, 0);

  if (_totalDisp > 1000) risks.push({ text: "Flood displacement: " + _totalDisp.toLocaleString() + " people displaced across the region", sev: _totalDisp > 10000 ? "critical" : "warning" });
  if (_dispPressure > 1.0) risks.push({ text: "Housing capacity exceeded: displaced population exceeds available housing by " + Math.round((_dispPressure - 1) * 100) + "%", sev: "critical" });
  if (_tribalDisp > 100) risks.push({ text: "Tribal treaty lands flooding: " + _tribalDisp.toLocaleString() + " tribal members displaced", sev: _tribalDisp > 500 ? "critical" : "warning" });
  if (_socStab < 0.60) risks.push({ text: "Social stability declining (" + (_socStab * 100).toFixed(0) + "%) — " + (_socStab < 0.40 ? "civil services overwhelmed, mass out-migration" : "housing competition, political tension"), sev: _socStab < 0.40 ? "critical" : "warning" });
  if (_relocCost > 1000) risks.push({ text: "Relocation cost crisis: estimated $" + (_relocCost / 1000).toFixed(1) + "B needed for permanent relocation", sev: "critical" });

  if (_v(ns.reserveMargin, 0.15) < 0 && _v(ns.reserveMargin, 0.15) >= -0.15) risks.push({ text: "Grid reserve margin at " + (_v(ns.reserveMargin, 0.15)*100).toFixed(0) + "% — demand exceeding regional capacity, inter-tie imports required", sev: "warning" });
  if (_v(ns.gridVulnerability, 0.1) > 0.3) risks.push({ text: "Grid vulnerability elevated (" + (_v(ns.gridVulnerability, 0.1)*100).toFixed(0) + "%) — drought reducing hydro availability", sev: _v(ns.gridVulnerability, 0.1) > 0.5 ? "critical" : "warning" });
  if (_v(ns.electricityPrice, 0.09) > 0.15) risks.push({ text: "Electricity price at $" + _v(ns.electricityPrice, 0.09).toFixed(2) + "/kWh — economic hardship, gas dependency driving costs", sev: _v(ns.electricityPrice, 0.09) > 0.20 ? "critical" : "warning" });
  if (_v(ns.dataCenterDemand, 600) > 2000) risks.push({ text: "Data center demand at " + Math.round(_v(ns.dataCenterDemand, 600)) + " MW — grid capacity constraints, clean energy targets strained", sev: _v(ns.dataCenterDemand, 600) > 4000 ? "critical" : "warning" });
  if (_v(ns.gridDamage, 0) > 0.2) risks.push({ text: "Grid infrastructure damaged (" + (_v(ns.gridDamage, 0)*100).toFixed(0) + "%) — earthquake/disaster recovery in progress", sev: _v(ns.gridDamage, 0) > 0.4 ? "critical" : "warning" });
  if (_v(ns.fishSpillCostDollars, 0) > 20) risks.push({ text: "Fish passage spill costing $" + _v(ns.fishSpillCostDollars, 0).toFixed(0) + "M/qtr in lost hydro generation — salmon-energy tradeoff active", sev: "info" });
  if (_v(ns.grantCountyStress, 0) > 0.5) risks.push({ text: "Grant County grid stress at " + (_v(ns.grantCountyStress, 0)*100).toFixed(0) + "% — data center demand straining eastern WA transmission", sev: _v(ns.grantCountyStress, 0) > 0.75 ? "critical" : "warning" });
  if (_v(ns.gridResilience, 0.5) < 0.3) risks.push({ text: "Grid resilience critically low (" + (_v(ns.gridResilience, 0.5)*100).toFixed(0) + "%) — insufficient source diversity, storage, and microgrid capability", sev: "critical" });
  if (_v(ns.gridResilience, 0.5) >= 0.3 && _v(ns.gridResilience, 0.5) < 0.4) risks.push({ text: "Grid resilience declining (" + (_v(ns.gridResilience, 0.5)*100).toFixed(0) + "%) — invest in storage and distributed generation", sev: "warning" });
  if (_v(ns.solarAdoption, 0.05) > 0.20 && _v(ns.batteryAdoption, 0) < 0.05) risks.push({ text: "Solar-battery mismatch — " + (_v(ns.solarAdoption, 0.05)*100).toFixed(0) + "% solar adoption but only " + (_v(ns.batteryAdoption, 0)*100).toFixed(0) + "% battery, duck curve stress increasing", sev: "warning" });
  if (_v(ns.totalDCDemand, 600) > 0 && _v(ns.totalDCDemand, 600) / Math.max(_v(ns.totalDemand, 12600), 1) > 0.15) risks.push({ text: "Data centers consuming " + ((_v(ns.totalDCDemand, 600) / Math.max(_v(ns.totalDemand, 12600), 1))*100).toFixed(0) + "% of total grid demand — clean energy targets at risk", sev: _v(ns.totalDCDemand, 600) / Math.max(_v(ns.totalDemand, 12600), 1) > 0.20 ? "critical" : "warning" });
  if (_v(ns.reserveMargin, 0.15) < -0.15) risks.push({ text: "Reserve margin critical (" + (_v(ns.reserveMargin, 0.15)*100).toFixed(0) + "%) — rolling blackouts imminent, inter-ties insufficient", sev: "critical" });
  if (_v(ns.threatDamage, 0) > 0.1) risks.push({ text: "Grid under active threat — " + (_v(ns.threatDamage, 0)*100).toFixed(0) + "% infrastructure affected", sev: _v(ns.threatDamage, 0) > 0.3 ? "critical" : "warning" });
  // ── SEA LEVEL RISE ──
  var _cslr = _v(ms.cumulativeSLR, 0);
  var _slrRate = _v(ms.slrRateMmYr, 0);
  if (_cslr > 1.0) risks.push({ text: "Sea level rise exceeds 1 meter (" + (_cslr * 100).toFixed(0) + " cm) — catastrophic coastal inundation", sev: "critical" });
  else if (_cslr > 0.5) risks.push({ text: "Sea level rise at " + (_cslr * 100).toFixed(0) + " cm — major coastal infrastructure at risk", sev: "critical" });
  else if (_cslr > 0.2) risks.push({ text: "Sea level rise at " + (_cslr * 100).toFixed(0) + " cm — increasing flood frequency and saltwater intrusion", sev: "warning" });
  if (_slrRate > 10) risks.push({ text: "SLR rate accelerating to " + _slrRate.toFixed(1) + " mm/yr — ice sheet instability likely", sev: _slrRate > 15 ? "critical" : "warning" });
  if (ms.thwaitesTriggered) risks.push({ text: "TIPPING POINT: Thwaites Ice Shelf has collapsed — SLR permanently accelerated, irreversible on human timescales", sev: "critical" });
  if (_v(ms.effectiveEnsoAmp, 1.0) > 1.5) risks.push({ text: "ENSO amplitude amplified " + _v(ms.effectiveEnsoAmp, 1.0).toFixed(1) + "\u00D7 — extreme El Ni\u00F1o/La Ni\u00F1a cycles intensifying ecosystem variability", sev: "warning" });
  // ── BENTHIC HABITAT (Greene review) ──
  if (_v(es.sandWaveIntegrity, 0.75) < 0.4) risks.push({ text: "Sand wave fields degrading (" + (_v(es.sandWaveIntegrity, 0.75)*100).toFixed(0) + "%) — sand lance burrowing habitat collapsing, cascading food web impacts", sev: _v(es.sandWaveIntegrity, 0.75) < 0.2 ? "critical" : "warning" });
  if (_v(es.deepUrchinPop, 0.35) > 0.55) risks.push({ text: "Deep-water urchin reservoir expanding (" + (_v(es.deepUrchinPop, 0.35)*100).toFixed(0) + "%) — recruitment pressure will sustain shallow urchin populations and kelp grazing", sev: "warning" });
  // ── TIER 2/3 ECOLOGICAL RISKS ──
  // Sunflower sea star SSWD recurrence
  if (_v(es.sunflowerStarPop, 0.02) < 0.01) risks.push({ text: "Sunflower sea star functionally extinct \u2014 urchin populations unchecked, kelp barrens expanding. Recovery requires decades (Harvell et al. 2019)", sev: "critical" });
  if (_v(es.sunflowerStarPop, 0.02) > 0.05 && _v(es.sunflowerStarPop, 0.02) < 0.15) risks.push({ text: "Sunflower sea star population at " + (_v(es.sunflowerStarPop, 0.02)*100).toFixed(0) + "% \u2014 early recovery signs but SSWD recurrence risk remains high if SST rises", sev: "warning" });
  // Fish farm pathogen risk
  if (_v(es.seaLicePressure, 0) > 0.04) risks.push({ text: "Sea lice pressure from open-net salmon farms (" + (_v(es.seaLicePressure, 0)*100).toFixed(0) + "% smolt mortality) \u2014 wild salmon at elevated disease risk in Georgia Strait", sev: _v(es.seaLicePressure, 0) > 0.05 ? "critical" : "warning" });
  // Water withdrawal stress
  if (_v(es.summerFlowStress, 0) > 0.25) risks.push({ text: "Summer baseflow stress \u2014 agricultural and municipal withdrawals reducing instream flow for salmon. Nooksack and Stillaguamish watersheds most affected", sev: _v(es.summerFlowStress, 0) > 0.4 ? "critical" : "warning" });
  return risks;
}

export { computeRiskList };
