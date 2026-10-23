// Example migration: changes nothing. Shows the shape every migration follows and proves the runner works
// (npm run migrate:up, then migrate:down).
module.exports = {
  description: "Example no-op migration",
  up: async () => {},
  down: async () => {},
};
