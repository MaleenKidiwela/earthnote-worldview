const POL = {
  forestRestore: { l: "Forest restoration", d: "Replant 15% watershed", ic: "🌲", c: "#639922", yr: 10, fx: { watershed: { forestCover: 15 } }, cost: 120 },
  wwUpgrade: { l: "Wastewater upgrade", d: "Tertiary treatment", ic: "🔧", c: "#534AB7", yr: 5, fx: { urban: { wastewaterEfficiency: 20 } }, cost: 450 },
  mpa: { l: "Expand marine protection", d: "+20% MPA coverage", ic: "🐋", c: "#1D9E75", yr: 3, fx: { ecosystem: { protectedAreaFraction: 20 } }, cost: 80 },
  cleanEnergy: { l: "Clean energy", d: "85% renewable", ic: "⚡", c: "#378ADD", yr: 15, fx: { urban: { energyCleanFraction: 40 } }, cost: 2000 },
  tidalEnergy: { l: "Tidal energy", d: "Harvest straits/channels (tradeoff: reduces mixing)", ic: "🌊", c: "#1B4F72", yr: 8, fx: { urban: { energyCleanFraction: 15 }, marine: { tidalEnergyExtraction: 60 } }, cost: 600 },
  fishMorat: { l: "Fishing moratorium", d: "Reduce pressure 50%", ic: "🐟", c: "#0F6E56", yr: 1, fx: { ecosystem: { fishingPressure: -30 } }, cost: 200 },
  shoreRestore: { l: "Shoreline restore", d: "Remove armoring", ic: "🏖", c: "#D85A30", yr: 8, fx: { watershed: { riparianBufferWidth: 25 } }, cost: 300 },
  orcaPlan: { l: "Orca recovery", d: "Vessel slowdowns", ic: "🐳", c: "#185FA5", yr: 2, fx: { ecosystem: { orcaProtectionLevel: 40 } }, cost: 50 },
  stormInfra: { l: "Green stormwater", d: "Modernize infrastructure", ic: "💧", c: "#5DCAA5", yr: 7, fx: { urban: { stormwaterInfraAge: -35, greenInfraFraction: 15 } }, cost: 800 },
  supplyResilience: { l: "Supply chain resilience", d: "Diversify trade routes", ic: "🔗", c: "#7D6608", yr: 5, fx: { port: { containerThroughput: 500 } }, cost: 350 },
  greenCrabRemoval: { l: "Green crab removal", d: "Intensive trapping program", ic: "🦀", c: "#922B21", yr: 3, fx: { ecosystem: { greenCrabRemoval: 50 } }, cost: 40 },
  eelgrassRestore: { l: "Eelgrass restoration", d: "Transplanting + seed broadcasting across bays", ic: "🌿", c: "#2E8B57", yr: 8, fx: { ecosystem: { eelgrassRestoration: 70 } }, cost: 95 },
};

export { POL };
