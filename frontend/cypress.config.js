const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require('@bahmutov/cypress-code-coverage/plugin')(on, config)
      return config
    },
  },
  "video": false
});
