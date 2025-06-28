need to use ES3 for communication in generated scripts with AE

## ES3 Compatibility Rules for After Effects Scripts
1. **NO template literal expressions**: Never use `${expression}` inside template literals in generated ExtendScript code
2. **Use string concatenation**: Replace `${condition ? 'code' : ''}` with `" + (condition ? 'code' : '') + "`
3. **Avoid ES6+ features**: No arrow functions, destructuring, const/let, or other modern JS features in generated scripts
4. **Test generated scripts**: Always check that the final ExtendScript code contains only ES3-compatible syntax

### Example - WRONG (ES6):
```javascript
generateScript: (params) => `
  var layer = comp.layer(1);
  ${params.visible ? `layer.enabled = true;` : ''}
`
```

### Example - CORRECT (ES3):
```javascript
generateScript: (params) => {
  return 'var layer = comp.layer(1);' + 
    (params.visible ? 'layer.enabled = true;' : '');
}
```

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.