// Manual test for apply_easy_ease script generation
import { ScriptGenerator } from './dist/ae-integration/scriptGeneratorNew.js';

const generator = new ScriptGenerator();

// Test parameters
const params = {
  compId: 1,
  layerIndex: 1,
  propertyPath: "Transform.Position",
  easeType: "ease"
};

try {
  const script = generator.generate('apply_easy_ease', params);
  console.log("Generated script:");
  console.log("================");
  console.log(script);
  console.log("================");
  
  // Check for common ES3 violations
  const violations = [];
  
  if (script.includes('`')) {
    violations.push("Contains template literals (backticks)");
  }
  
  if (script.includes('${')) {
    violations.push("Contains template literal expressions");
  }
  
  if (script.includes('=>')) {
    violations.push("Contains arrow functions");
  }
  
  if (script.includes('const ') || script.includes('let ')) {
    violations.push("Contains const/let declarations");
  }
  
  // Check for potential syntax errors
  const openParens = (script.match(/\(/g) || []).length;
  const closeParens = (script.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    violations.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  }
  
  const openBraces = (script.match(/\{/g) || []).length;
  const closeBraces = (script.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    violations.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }
  
  const quotes = script.split('');
  let inString = false;
  let stringChar = null;
  let escaped = false;
  for (let i = 0; i < quotes.length; i++) {
    const char = quotes[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = null;
    }
  }
  if (inString) {
    violations.push("Unclosed string literal");
  }
  
  if (violations.length > 0) {
    console.log("\nES3 VIOLATIONS FOUND:");
    violations.forEach(v => console.log("- " + v));
  } else {
    console.log("\n✅ No ES3 violations detected");
  }
  
} catch (error) {
  console.error("Error generating script:", error);
}