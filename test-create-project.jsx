// Test script to debug create_project
// Run this directly in After Effects Script Editor

var testName = "Avery_2nd_Birthday";

try {
    // Test 1: Basic project creation
    var project = app.newProject();
    if (project) {
        $.writeln("Project created successfully");
        
        // Test 2: Setting project name
        project.name = testName;
        $.writeln("Project name set to: " + project.name);
        
        // Test 3: Check project properties
        $.writeln("Project file: " + (project.file ? project.file.fsName : "null"));
        $.writeln("Project numItems: " + project.numItems);
        
        // Test 4: Return success object
        var result = {
            success: true,
            data: {
                name: project.name,
                file: project.file ? project.file.fsName : null,
                numItems: project.numItems
            }
        };
        
        $.writeln("Result: " + JSON.stringify(result));
    } else {
        $.writeln("ERROR: app.newProject() returned null/undefined");
    }
} catch (e) {
    $.writeln("ERROR: " + e.toString());
    $.writeln("Error number: " + e.number);
}