// ═══════════════════════════════════════════════════════════
// DISPLAY MODES — Context-specific optimization
// ═══════════════════════════════════════════════════════════
// Different physical contexts require different display
// settings. A museum kiosk, a classroom projector, a
// legislative hearing, and a whale watching boat all need
// different things from the same application.
//
// Applied via URL parameter (?mode=museum) or settings toggle.
// Read on startup, stored in localStorage.
//
// ES6 convention (config file).
// ═══════════════════════════════════════════════════════════

export const DISPLAY_MODES = {
  default: {
    id: 'default',
    name: 'Standard',
    description: 'Desktop browser, individual use',
    fontSize: 1.0,
    minTouchTarget: 44,
    showSliders: true,
    showDetailedMetrics: true,
    autoPlay: false,
    forceTheme: null,
    printMode: false,
    attractMode: false,
    idleTimeout: null,
    hideNavigation: false,
    teacherControls: false,
    simplifiedControls: false,
  },

  museum: {
    id: 'museum',
    name: 'Museum / Kiosk',
    description: 'Public display, no keyboard, large screen',
    fontSize: 1.5,
    minTouchTarget: 64,
    showSliders: false,
    showDetailedMetrics: false,
    autoPlay: true,
    forceTheme: null,
    printMode: false,
    attractMode: true,
    idleTimeout: 120, // seconds before attract mode activates
    hideNavigation: true,
    teacherControls: false,
    simplifiedControls: true,
    notes: 'For Seattle Aquarium, Puyallup Tribal Museum, Whale Museum Friday Harbor. Use Quick Questions or Discovery Story Mode only.',
  },

  classroom: {
    id: 'classroom',
    name: 'Classroom',
    description: 'Teacher projecting to 30 students',
    fontSize: 1.3,
    minTouchTarget: 44,
    showSliders: true,
    showDetailedMetrics: false,
    autoPlay: false,
    forceTheme: 'light',
    printMode: false,
    attractMode: false,
    idleTimeout: null,
    hideNavigation: false,
    teacherControls: true,
    simplifiedControls: false,
    notes: 'Force light mode for projector readability. Larger fonts. Headline metrics only.',
  },

  hearing: {
    id: 'hearing',
    name: 'Legislative Hearing',
    description: 'Policy presentation, printable outputs',
    fontSize: 1.1,
    minTouchTarget: 44,
    showSliders: false,
    showDetailedMetrics: false,
    autoPlay: false,
    forceTheme: null,
    printMode: true,
    attractMode: false,
    idleTimeout: null,
    hideNavigation: false,
    teacherControls: false,
    simplifiedControls: true,
    showBudget: true,
    showTradeoffs: true,
    notes: 'For WA State Legislature, BC Legislature, tribal council. Presenter controls, audience watches. Print Summary button prominent.',
  },

  field: {
    id: 'field',
    name: 'Field / Outdoor',
    description: 'iPad on a whale watching boat or research vessel',
    fontSize: 1.2,
    minTouchTarget: 56,
    showSliders: false,
    showDetailedMetrics: false,
    autoPlay: false,
    forceTheme: 'light',
    printMode: false,
    attractMode: false,
    idleTimeout: null,
    hideNavigation: false,
    teacherControls: false,
    simplifiedControls: true,
    showLiveData: true,
    showMap: true,
    notes: 'For Nina on her whale watching boat, Sarah at Twanoh. Sunlight readable. Large touch targets for gloved hands or boat motion.',
  },
};

export const DISPLAY_MODE_COUNT = Object.keys(DISPLAY_MODES).length;

// Read display mode from URL parameter or localStorage
export function getDisplayMode() {
  // Check URL parameter first
  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode');
      if (urlMode && DISPLAY_MODES[urlMode]) return DISPLAY_MODES[urlMode];
    } catch (e) { /* URL parsing failed */ }
  }
  // Check localStorage
  try {
    const stored = localStorage.getItem('salish-display-mode');
    if (stored && DISPLAY_MODES[stored]) return DISPLAY_MODES[stored];
  } catch (e) { /* localStorage unavailable */ }
  return DISPLAY_MODES.default;
}

// Store display mode preference
export function setDisplayMode(modeId) {
  try {
    localStorage.setItem('salish-display-mode', modeId);
  } catch (e) { /* noop */ }
}

// Apply display mode to document
// Note: themeApplier is an optional callback for theme forcing,
// passed by the caller to avoid ES module import issues.
export function applyDisplayMode(mode, themeApplier) {
  if (typeof document === 'undefined') return;
  var root = document.documentElement;
  root.style.setProperty('--font-scale', String(mode.fontSize));
  root.style.setProperty('--min-touch', mode.minTouchTarget + 'px');
  root.dataset.displayMode = mode.id;
  // Force theme if specified
  if (mode.forceTheme && typeof themeApplier === 'function') {
    themeApplier(mode.forceTheme);
  }
}
