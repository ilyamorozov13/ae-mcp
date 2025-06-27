// Fix network access permission in After Effects
// This script attempts to enable the network access programmatically

try {
    // Try to set the preference directly
    app.preferences.savePrefAsBool("Main Pref Section v2", "Pref_SCRIPTING_FILE_NETWORK_SECURITY", true);
    
    // Also try the newer preference key
    app.preferences.savePrefAsBool("Main Pref Section v2", "Allow Scripts to Write Files and Access Network", true);
    
    alert("Network access preference updated!\n\nPlease restart After Effects for the change to take effect.");
    
} catch(e) {
    alert("Could not update preference automatically.\n\nError: " + e.toString() + "\n\nPlease try the ExtendScript bridge instead.");
}