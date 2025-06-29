# Layer Ordering Guide for MCP Clients

## Understanding After Effects Layer Order

In After Effects, layers are stacked with **Layer 1 on top** and higher-numbered layers underneath. This is the opposite of what many people expect:

- Layer 1: Top (foreground)
- Layer 2: Below Layer 1
- Layer 3: Below Layer 2
- ...and so on

**Important:** When you add new layers, they are added as Layer 1 (on top), pushing existing layers down.

## The Background Layer Problem

When creating compositions with backgrounds, the common mistake is:
1. Create background first → becomes Layer 1 (on top)
2. Create other elements → they appear below the background
3. Result: Background covers everything!

## Solutions

### Solution 1: Create Layers in Reverse Order (Recommended)

Create layers from **foreground to background**:

```javascript
// ✅ CORRECT ORDER: Front to back
await batch_execute({
  commands: [
    // 1. Create foreground elements first
    {
      tool: "add_text_layer_advanced",
      params: {
        compId: 1,
        text: "AE-MCP",
        name: "Main Title",
        position: [960, 450],
        sourceText: { fontSize: 120, fillColor: [1, 1, 1] }
      }
    },
    {
      tool: "add_text_layer_advanced", 
      params: {
        compId: 1,
        text: "PRO",
        name: "Pro Badge",
        position: [1200, 380],
        sourceText: { fontSize: 60, fillColor: [1, 0.42, 0.42] }
      }
    },
    {
      tool: "add_text_layer_advanced",
      params: {
        compId: 1,
        text: "Automate After Effects with AI",
        name: "Tagline",
        position: [960, 580],
        sourceText: { fontSize: 40, fillColor: [1, 1, 1] }
      }
    },
    // 2. Create background LAST
    {
      tool: "add_solid_layer",
      params: {
        compId: 1,
        name: "Background",
        color: [0.4, 0.494, 0.918]
      }
    }
  ]
});
```

### Solution 2: Create Then Reorder

Create layers in any order, then reorder them:

```javascript
// Step 1: Create layers (any order)
await batch_execute({
  commands: [
    {
      tool: "add_solid_layer",
      params: { compId: 1, name: "Background", color: [0.4, 0.494, 0.918] }
    },
    {
      tool: "add_text_layer_advanced",
      params: { compId: 1, text: "Title", name: "Title" }
    },
    {
      tool: "add_text_layer_advanced", 
      params: { compId: 1, text: "Subtitle", name: "Subtitle" }
    }
  ]
});

// Step 2: Reorder layers (background to bottom)
await batch_execute({
  commands: [
    // Move background from layer 1 to layer 3 (bottom)
    {
      tool: "reorder_layers",
      params: { compId: 1, layerIndex: 1, newIndex: 3 }
    }
  ]
});
```

### Solution 3: Use Layer Indices in Batch Operations

When you know the final structure, create and immediately reorder:

```javascript
await batch_execute({
  sequential: true, // Important: Execute in order
  commands: [
    // Create all layers
    { tool: "add_solid_layer", params: { compId: 1, name: "Background" } },
    { tool: "add_text_layer", params: { compId: 1, text: "Title" } },
    { tool: "add_shape_layer", params: { compId: 1, name: "Logo" } },
    
    // Reorder to desired structure
    // Background should be at bottom (layer 3)
    { tool: "reorder_layers", params: { compId: 1, layerIndex: 1, newIndex: 3 } }
  ]
});
```

## Best Practices

### 1. Plan Your Layer Stack
Before creating layers, plan the stack from top to bottom:
```
Layer 1: UI Elements (buttons, overlays)
Layer 2: Main Content (text, logos)
Layer 3: Mid-ground elements
Layer 4: Background elements
Layer 5: Background solid/image
```

### 2. Use Descriptive Names
Always name your layers clearly to avoid confusion:
```javascript
{
  tool: "add_solid_layer",
  params: {
    compId: 1,
    name: "Background - Blue Gradient", // Clear purpose
    color: [0.4, 0.494, 0.918]
  }
}
```

### 3. Group Related Operations
When creating complex compositions, group related layers:
```javascript
// Create UI elements together
const uiElements = [
  { tool: "add_text_layer", params: { text: "Button 1", name: "UI - Button 1" } },
  { tool: "add_text_layer", params: { text: "Button 2", name: "UI - Button 2" } }
];

// Create background elements together  
const backgroundElements = [
  { tool: "add_solid_layer", params: { name: "BG - Gradient" } },
  { tool: "add_shape_layer", params: { name: "BG - Pattern" } }
];

// Execute in correct order
await batch_execute({
  commands: [...uiElements, ...backgroundElements]
});
```

## Common Patterns

### Hero Section with Background
```javascript
// Create from front to back
await batch_execute({
  commands: [
    // Foreground: Call-to-action button
    {
      tool: "add_shape_layer",
      params: {
        compId: 1,
        name: "CTA Button",
        shapeType: "rectangle",
        properties: {
          size: [200, 60],
          fillColor: [1, 0.4, 0.2],
          position: [960, 700]
        }
      }
    },
    // Middle: Main title
    {
      tool: "add_text_layer_advanced",
      params: {
        compId: 1,
        text: "Welcome",
        name: "Hero Title",
        position: [960, 400]
      }
    },
    // Background: Solid color (created last)
    {
      tool: "add_solid_layer",
      params: {
        compId: 1,
        name: "Hero Background",
        color: [0.1, 0.1, 0.2]
      }
    }
  ]
});
```

### Logo Animation with Background
```javascript
// Step 1: Create elements (logo first, background last)
await batch_execute({
  commands: [
    // Logo elements
    { tool: "add_shape_layer", params: { compId: 1, name: "Logo Shape" } },
    { tool: "add_text_layer", params: { compId: 1, text: "BRAND", name: "Logo Text" } },
    // Background
    { tool: "add_solid_layer", params: { compId: 1, name: "Logo BG", color: [0, 0, 0] } }
  ]
});

// Step 2: Animate (background doesn't need animation)
await batch_keyframes({
  compId: 1,
  keyframes: [
    // Animate only the logo elements
    { layerIndex: 1, property: "Scale", time: 0, value: [0, 0] },
    { layerIndex: 1, property: "Scale", time: 1, value: [100, 100] },
    { layerIndex: 2, property: "Opacity", time: 0, value: 0 },
    { layerIndex: 2, property: "Opacity", time: 1, value: 100 }
  ]
});
```

## Quick Reference

| Order | What to Create | Layer Position |
|-------|---------------|----------------|
| 1st   | Foreground elements (UI, text) | Will be Layer 1 (top) |
| 2nd   | Middle elements (main content) | Will be Layer 2 |
| 3rd   | Background elements | Will be Layer 3+ (bottom) |

**Remember:** Create backgrounds LAST to keep them at the bottom of the stack!