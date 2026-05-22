// ═══════════════════════════════════════════════════════════
// rfPredict.js — Lightweight Random Forest evaluator
// ═══════════════════════════════════════════════════════════
// Evaluates pre-trained Random Forest models exported as JSON
// decision trees. No ML libraries needed — pure tree traversal.
//
// Tree format:
//   Internal node: { feature: "sst", threshold: 12.5, left: {...}, right: {...} }
//   Leaf node: { value: 0.43 }
//
// Model format:
//   { name, trees: [...], features: [...], importance: {...}, meta: {...} }
//
// Performance: O(depth × nTrees) per prediction.
// 100 trees × depth 8 = ~800 comparisons = microseconds.
//
// ES5 convention (var, function).
// ═══════════════════════════════════════════════════════════

import { RF_MODELS } from '../config/rfModels.js';

// Traverse a single decision tree with given feature values
function traverseTree(node, features) {
  if (node.value !== undefined) {
    return node.value; // leaf
  }
  var fVal = features[node.feature];
  if (fVal === undefined || fVal === null) fVal = 0; // missing feature → go left
  if (fVal <= node.threshold) {
    return traverseTree(node.left, features);
  } else {
    return traverseTree(node.right, features);
  }
}

// Predict: average leaf values across all trees (regression)
export function rfPredict(modelName, features) {
  var model = RF_MODELS[modelName];
  if (!model || !model.trees || model.trees.length === 0) return undefined;

  var sum = 0;
  var n = model.trees.length;
  for (var i = 0; i < n; i++) {
    sum += traverseTree(model.trees[i], features);
  }
  return sum / n;
}

// Classify: majority vote across trees (each tree returns a class label string)
export function rfClassify(modelName, features) {
  var model = RF_MODELS[modelName];
  if (!model || !model.trees || model.trees.length === 0) return undefined;

  var votes = {};
  for (var i = 0; i < model.trees.length; i++) {
    var label = traverseTree(model.trees[i], features);
    var key = String(label);
    votes[key] = (votes[key] || 0) + 1;
  }

  var best = null;
  var bestCount = -1;
  var keys = Object.keys(votes);
  for (var j = 0; j < keys.length; j++) {
    if (votes[keys[j]] > bestCount) {
      bestCount = votes[keys[j]];
      best = keys[j];
    }
  }
  return best;
}

// Return feature importances from model metadata
export function rfImportance(modelName) {
  var model = RF_MODELS[modelName];
  if (!model || !model.importance) return undefined;
  return model.importance;
}

// List all available model names
export function rfModelNames() {
  return Object.keys(RF_MODELS);
}
