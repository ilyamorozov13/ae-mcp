// Test the apply_effect function to identify the syntax error

import { ScriptGenerator } from './dist/ae-integration/scriptGeneratorNew.js';

const generator = new ScriptGenerator();

// Test parameters
const params = {
  compId: 931,
  layerIndex: 1,
  effectName: "Gaussian Blur"
};

try {
  const script = generator.generate('apply_effect', params);
  console.log("Generated script:");
  console.log("================");
  console.log(script);
  console.log("================");
  
  // Check for common syntax errors
  const lines = script.split('\n');
  lines.forEach((line, index) => {
    // Check for unbalanced quotes
    const doubleQuotes = (line.match(/"/g) || []).length;
    const escapedQuotes = (line.match(/\\"/g) || []).length;
    const unescapedQuotes = doubleQuotes - escapedQuotes;
    
    if (unescapedQuotes % 2 !== 0) {
      console.log(`\nPossible unbalanced quotes at line ${index + 1}:`);
      console.log(line);
    }
    
    // Check for template literals (backticks)
    if (line.includes('`')) {
      console.log(`\nERROR: Template literal found at line ${index + 1}:`);
      console.log(line);
    }
    
    // Check for ES6+ syntax
    if (line.includes('=>') || line.includes('const ') || line.includes('let ')) {
      console.log(`\nERROR: ES6+ syntax found at line ${index + 1}:`);
      console.log(line);
    }
  });
  
} catch (error) {
  console.error("Error generating script:", error);
}