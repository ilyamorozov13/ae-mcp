// Debug script to test the simplest possible command

// This is what the ping command generates:
var now = new Date();
var timestamp = now.getFullYear() + '-' + 
               ('0' + (now.getMonth() + 1)).slice(-2) + '-' + 
               ('0' + now.getDate()).slice(-2) + 'T' + 
               ('0' + now.getHours()).slice(-2) + ':' + 
               ('0' + now.getMinutes()).slice(-2) + ':' + 
               ('0' + now.getSeconds()).slice(-2) + '.' + 
               ('00' + now.getMilliseconds()).slice(-3) + 'Z';

return {
  success: true,
  data: {
    message: "pong",
    timestamp: timestamp
  }
};

// Note: The actual generated script would be wrapped in a try-catch IIFE:
/*
(function() {
  try {
    // script here
  } catch (error) {
    return { 
      success: false, 
      error: { 
        message: error.toString(), 
        code: error.number ? error.number : 'UNKNOWN' 
      } 
    };
  }
})();
*/