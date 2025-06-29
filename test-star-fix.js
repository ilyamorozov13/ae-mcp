// Test script to verify star shape creation fix
// This creates star shapes with various scale values including [0,0]

const testStars = [
  {
    name: "Star Normal Scale",
    properties: {
      fillColor: [1, 1, 0],
      innerRadius: 5,
      outerRadius: 20,
      points: 4,
      position: [750, 450],
      scale: [100, 100]  // Normal scale
    }
  },
  {
    name: "Star Zero Scale (Fixed)",
    properties: {
      fillColor: [1, 0, 0],
      innerRadius: 5,
      outerRadius: 20,
      points: 4,
      position: [950, 450],
      scale: [0, 0]  // This should be converted to [0.01, 0.01]
    }
  },
  {
    name: "Star Small Scale",
    properties: {
      fillColor: [0, 1, 0],
      innerRadius: 5,
      outerRadius: 20,
      points: 4,
      position: [1150, 450],
      scale: [10, 10]  // Small but visible
    }
  }
];

console.log("Testing star shape creation with fixed transform property access...");
console.log("Creating " + testStars.length + " test stars");

// The actual command execution would happen through the MCP server
// This is just to document the test cases
testStars.forEach(star => {
  console.log("\nCreating: " + star.name);
  console.log("Scale: [" + star.properties.scale.join(", ") + "]");
  console.log("Position: [" + star.properties.position.join(", ") + "]");
});

console.log("\nIf the fix is working correctly:");
console.log("- All stars should be created without errors");
console.log("- The 'Zero Scale' star will have scale [0.01, 0.01] instead of [0, 0]");
console.log("- No 'property is hidden' errors should occur");