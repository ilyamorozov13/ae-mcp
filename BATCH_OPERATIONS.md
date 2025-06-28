# Batch Operations Guide

## Efficient Keyframe Animation

Instead of calling `set_keyframe` multiple times, use `batch_keyframes` for better performance.

### Example: Animating Multiple Properties

**Inefficient approach (6 separate calls):**
```javascript
// Each call creates a separate command file and script execution
await set_keyframe({ compId: 1, layerIndex: 1, property: "Position", time: 0, value: [100, 100] });
await set_keyframe({ compId: 1, layerIndex: 1, property: "Position", time: 1, value: [200, 200] });
await set_keyframe({ compId: 1, layerIndex: 1, property: "Scale", time: 0, value: [100, 100] });
await set_keyframe({ compId: 1, layerIndex: 1, property: "Scale", time: 1, value: [150, 150] });
await set_keyframe({ compId: 1, layerIndex: 1, property: "Rotation", time: 0, value: 0 });
await set_keyframe({ compId: 1, layerIndex: 1, property: "Rotation", time: 1, value: 360 });
```

**Efficient approach (1 batch call):**
```javascript
await batch_keyframes({
  compId: 1,
  keyframes: [
    { layerIndex: 1, property: "Position", time: 0, value: [100, 100] },
    { layerIndex: 1, property: "Position", time: 1, value: [200, 200] },
    { layerIndex: 1, property: "Scale", time: 0, value: [100, 100] },
    { layerIndex: 1, property: "Scale", time: 1, value: [150, 150] },
    { layerIndex: 1, property: "Rotation", time: 0, value: 0 },
    { layerIndex: 1, property: "Rotation", time: 1, value: 360 }
  ]
});
```

### Example: Animating Multiple Layers

```javascript
await batch_keyframes({
  compId: 1,
  keyframes: [
    // Layer 1 - Fade in
    { layerIndex: 1, property: "Opacity", time: 0, value: 0 },
    { layerIndex: 1, property: "Opacity", time: 1, value: 100 },
    
    // Layer 2 - Scale up
    { layerIndex: 2, property: "Scale", time: 0, value: [0, 0] },
    { layerIndex: 2, property: "Scale", time: 1, value: [100, 100] },
    
    // Layer 3 - Slide in from left
    { layerIndex: 3, property: "Position", time: 0, value: [-500, 540] },
    { layerIndex: 3, property: "Position", time: 1, value: [960, 540] }
  ]
});
```

## Batch Layer Creation

Use `batch_create_layers` to create multiple layers at once:

```javascript
await batch_create_layers({
  compId: 1,
  layers: [
    {
      type: "text",
      name: "Title",
      properties: {
        text: "Welcome",
        position: [960, 200],
        scale: [150, 150]
      }
    },
    {
      type: "solid",
      name: "Background",
      properties: {
        color: [0.2, 0.3, 0.8],
        opacity: 80
      }
    },
    {
      type: "shape",
      name: "Circle",
      properties: {
        position: [960, 540],
        scale: [200, 200]
      }
    }
  ]
});
```

## General Batch Execution

For mixed operations, use `batch_execute`:

```javascript
await batch_execute({
  commands: [
    {
      tool: "create_composition",
      params: { name: "Comp 1", width: 1920, height: 1080, duration: 10 },
      id: "comp1"
    },
    {
      tool: "create_composition", 
      params: { name: "Comp 2", width: 1920, height: 1080, duration: 10 },
      id: "comp2"
    },
    {
      tool: "save_project",
      params: { filePath: "/path/to/project.aep" },
      id: "save"
    }
  ],
  sequential: false  // Execute in parallel when possible
});
```

## Performance Benefits

- **Reduced file I/O**: One command file instead of many
- **Single script execution**: After Effects runs one script with loops
- **Less overhead**: Fewer round trips between MCP and After Effects
- **Atomic operations**: All keyframes in a batch succeed or fail together

## Best Practices

1. **Group related keyframes**: Batch all keyframes for a single animation together
2. **Use appropriate batch size**: 50-100 keyframes per batch is usually optimal
3. **Consider dependencies**: Use `sequential: true` in `batch_execute` when order matters
4. **Handle failures**: Check the results array for any failed operations