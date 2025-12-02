// Webpack configuration override for react-scripts
// This tells webpack to ignore Node.js built-in modules in the browser

module.exports = function override(config, env) {
  // Add fallback for Node.js built-in modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": false,
    "stream": false,
    "buffer": false,
    "util": false,
    "url": false,
    "zlib": false,
    "http": false,
    "https": false,
    "assert": false,
    "os": false,
    "path": false,
    "fs": false
  };
  
  return config;
};

