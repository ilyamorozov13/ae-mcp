# Test Commands for AE MCP

## 1. First, create a new project (if needed):
```
create_project
```

## 2. Create a test composition:
```
create_composition
{
  "name": "Test Comp",
  "width": 1920,
  "height": 1080,
  "duration": 10,
  "frameRate": 30
}
```

## 3. Add a solid layer:
```
create_layer
{
  "compId": 1,  // Note: You may need to adjust this ID based on what's returned from create_composition
  "type": "solid",
  "name": "Test Layer",
  "color": [1, 0, 0]
}
```

## 4. Test setting a position keyframe:
```
set_keyframe
{
  "compId": 1,  // Adjust based on your comp ID
  "layerIndex": 1,
  "property": "Position",
  "time": 0,
  "value": [960, 540]
}
```

## 5. Set another position keyframe:
```
set_keyframe
{
  "compId": 1,  // Adjust based on your comp ID
  "layerIndex": 1,
  "property": "Position",
  "time": 2,
  "value": [100, 100]
}
```

## 6. Test other properties:

### Opacity keyframe:
```
set_keyframe
{
  "compId": 1,
  "layerIndex": 1,
  "property": "Opacity",
  "time": 0,
  "value": 100
}
```

### Scale keyframe:
```
set_keyframe
{
  "compId": 1,
  "layerIndex": 1,
  "property": "Scale",
  "time": 0,
  "value": [100, 100]
}
```

### Rotation keyframe:
```
set_keyframe
{
  "compId": 1,
  "layerIndex": 1,
  "property": "Rotation",
  "time": 0,
  "value": 0
}
```

## Notes:
- Make sure the ae-file-bridge-simple-poll.jsx script is running in After Effects
- Check the Info panel (Window > Info) in After Effects for debug output
- If you get comp ID errors, use `get_project_info` first to see what compositions exist