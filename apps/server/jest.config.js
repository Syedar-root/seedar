module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@metric-engine/core$": "<rootDir>/../../packages/metric_engine/src/index",
    "^@seedar/types$": "<rootDir>/../../packages/types/src/index",
  },
  transformIgnorePatterns: [
    "<rootDir>/../../node_modules/(?!chalk)/",
  ],
};
