# Expression Tools Guide for AE-MCP

## Important: Correct Tool Names

The correct tool for setting expressions is **`set_expression`**, NOT `add_expression`.

## Available Expression Tools

### 1. `set_expression` - Set an expression on any property
**This is the main tool for adding expressions to properties.**

```javascript
{
  "tool": "set_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position",
    "expression": "[960, 540 + Math.sin(time * 2) * 100]",
    "enabled": true  // Optional, defaults to true
  }
}
```

Common property paths:
- `"Transform.Position"` - Layer position
- `"Transform.Scale"` - Layer scale
- `"Transform.Rotation"` - Layer rotation
- `"Transform.Opacity"` - Layer opacity
- `"Effects.Gaussian Blur.Blurriness"` - Effect properties

### 2. `get_expression` - Get the current expression
```javascript
{
  "tool": "get_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position"
  }
}
```

### 3. `remove_expression` - Remove an expression
```javascript
{
  "tool": "remove_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position"
  }
}
```

### 4. `enable_expression` - Enable/disable without removing
```javascript
{
  "tool": "enable_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position",
    "enabled": false  // Disable the expression
  }
}
```

### 5. `batch_set_expressions` - Set multiple expressions efficiently
```javascript
{
  "tool": "batch_set_expressions",
  "params": {
    "compId": 1,
    "expressions": [
      {
        "layerIndex": 1,
        "propertyPath": "Transform.Position",
        "expression": "[960, 540 + Math.sin(time) * 100]"
      },
      {
        "layerIndex": 2,
        "propertyPath": "Transform.Rotation",
        "expression": "time * 45"
      }
    ]
  }
}
```

## Specialized Expression Tools

### `add_wiggle_expression` - Add random movement
```javascript
{
  "tool": "add_wiggle_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position",
    "frequency": 5,      // Wiggles per second
    "amplitude": 50,     // Maximum deviation
    "octaves": 1,        // Complexity (optional)
    "ampMultiplier": 0.5 // Amplitude decay (optional)
  }
}
```

### `add_loop_expression` - Loop animations
```javascript
{
  "tool": "add_loop_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position",
    "loopType": "cycle",      // or "pingpong", "offset", "continue"
    "numKeyframes": 0         // 0 = all keyframes
  }
}
```

### `link_properties_with_expression` - Connect properties
```javascript
{
  "tool": "link_properties_with_expression",
  "params": {
    "compId": 1,
    "sourceLayer": 1,
    "sourceProperty": "Transform.Rotation",
    "targetLayer": 2,
    "targetProperty": "Transform.Rotation",
    "linkType": "multiply",   // or "direct", "inverse", "offset", "custom"
    "multiplier": 2          // For multiply type
  }
}
```

### `add_expression_control` - Add control effects
```javascript
{
  "tool": "add_expression_control",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "controlType": "slider",  // or "point", "angle", "checkbox", "color", "layer", "point3d"
    "name": "Speed Control",
    "value": 10              // Initial value
  }
}
```

## Common Expression Examples

### 1. Sine Wave Animation
```javascript
// Smooth up/down movement
{
  "tool": "set_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position",
    "expression": "value + [0, Math.sin(time * 2) * 100]"
  }
}
```

### 2. Follow Mouse (2D layers)
```javascript
{
  "tool": "set_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position",
    "expression": "[thisComp.layer('Null 1').transform.position[0], thisComp.layer('Null 1').transform.position[1]]"
  }
}
```

### 3. Time-based Rotation
```javascript
{
  "tool": "set_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Rotation",
    "expression": "time * 90"  // 90 degrees per second
  }
}
```

### 4. Bounce Expression
```javascript
{
  "tool": "set_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Scale",
    "expression": "amp = .1; freq = 2.0; decay = 2.0; n = 0; if (numKeys > 0){ n = nearestKey(time).index; if (key(n).time > time){ n--; } } if (n == 0){ t = 0; }else{ t = time - key(n).time; } if (n > 0 && t < 1){ v = velocityAtTime(key(n).time - thisComp.frameDuration/10); value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); }else{ value; }"
  }
}
```

### 5. Fade Based on Distance
```javascript
{
  "tool": "set_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Opacity",
    "expression": "target = thisComp.layer('Control'); d = length(position, target.position); linear(d, 0, 500, 100, 0)"
  }
}
```

## Expression Control Workflow

### Step 1: Add Control Effects
```javascript
{
  "tool": "batch_execute",
  "params": {
    "commands": [
      {
        "tool": "add_expression_control",
        "params": {
          "compId": 1,
          "layerIndex": 1,
          "controlType": "slider",
          "name": "Amplitude",
          "value": 100
        }
      },
      {
        "tool": "add_expression_control",
        "params": {
          "compId": 1,
          "layerIndex": 1,
          "controlType": "slider",
          "name": "Frequency",
          "value": 2
        }
      }
    ]
  }
}
```

### Step 2: Reference Controls in Expressions
```javascript
{
  "tool": "set_expression",
  "params": {
    "compId": 1,
    "layerIndex": 1,
    "propertyPath": "Transform.Position",
    "expression": "amp = effect('Amplitude')('Slider'); freq = effect('Frequency')('Slider'); value + [0, Math.sin(time * freq) * amp]"
  }
}
```

## Common Mistakes

### ❌ Wrong Tool Name
```javascript
// This will fail - no such tool
{ "tool": "add_expression", ... }
```

### ✅ Correct Tool Name
```javascript
// Use set_expression instead
{ "tool": "set_expression", ... }
```

### ❌ Wrong Property Path Format
```javascript
// This may fail
"propertyPath": "position"
```

### ✅ Correct Property Path Format
```javascript
// Use full property path
"propertyPath": "Transform.Position"
```

### ❌ Missing Escaping in Complex Expressions
```javascript
// May cause parsing errors
"expression": "text.sourceText = "Hello World""
```

### ✅ Properly Escaped Expressions
```javascript
// Escape quotes in expressions
"expression": "text.sourceText = \"Hello World\""
```

## ES3 Compatibility Note

All expressions must be ES3-compatible for After Effects:
- No arrow functions: Use `function()` instead of `() =>`
- No template literals: Use string concatenation instead of backticks
- No const/let: Use `var` only
- No array methods like .map(), .filter()
- No destructuring or spread operators

## Advanced: Custom ExtendScript

For complex operations not covered by specific tools, use `execute_script`:

```javascript
{
  "tool": "execute_script",
  "params": {
    "script": "var comp = app.project.activeItem; var layer = comp.layer(1); layer.property('Transform').property('Position').expression = 'wiggle(5, 50)';",
    "wrapInTransaction": true,
    "undoGroupName": "Add Custom Expression"
  }
}
```

Remember: The `execute_script` tool requires ES3-compatible ExtendScript code.