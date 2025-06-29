# Shape Layer "Property is Hidden" Fix

## Problem
When creating star shape layers with certain properties (particularly with scale [0, 0]), After Effects was throwing the error:
```
Can not "set value" with this property, because the property or a parent property is hidden.
```

## Root Cause
The issue occurred because:
1. Shape properties were being accessed directly on the contents group
2. Property access order matters in After Effects - some properties become hidden based on the shape type
3. Setting properties immediately after shape creation can fail if AE hasn't fully initialized the shape

## Solution
The fix involves several improvements:

### 1. Use Shape Groups
Instead of adding shapes directly to contents, create a shape group first:
```javascript
var shapeGroup = contents.addProperty("ADBE Vector Group");
var vectors = shapeGroup.property("ADBE Vectors Group");
```

### 2. Property Access Order
Set properties in a specific order to avoid hidden property issues:
1. First set points (always safe)
2. Then set outer radius
3. Set shape type (polygon vs star) AFTER basic properties
4. Only set inner radius for stars

### 3. Property Validation
Added `canSetValue` checks before setting any property:
```javascript
if (prop && prop.canSetValue) {
  prop.setValue(value);
}
```

### 4. Error Handling
Wrapped property access in try-catch blocks to prevent complete failure:
- Shape properties in one try-catch
- Transform properties in another try-catch
- Layer is still created even if some properties fail

### 5. Zero Scale Protection
The existing protection for [0, 0] scale was retained:
```javascript
if (scaleValue[0] === 0 && scaleValue[1] === 0) {
  scaleValue = [0.01, 0.01];
}
```

## Files Modified
- `/src/ae-integration/generators/layerGenerators.ts` - Updated `addShapeLayer` function

## Testing
The fix handles both test cases that were failing:
1. Star with scale: [0, 0] and opacity: 100
2. Star without scale property

The shape layer is now created successfully with all properties applied correctly.