import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "jsdom",
      testMatch: ["**/__tests__/lib/**/*.test.ts", "**/__tests__/components/**/*.test.tsx"],
      roots: ["<rootDir>/src"],
      moduleDirectories: ["node_modules", "<rootDir>"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setupTests.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: {
              jsx: "react-jsx",
            },
          },
        ],
      },
    },
    {
      displayName: "api",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["**/__tests__/api/**/*.test.ts"],
      roots: ["<rootDir>/src"],
      moduleDirectories: ["node_modules", "<rootDir>"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: {
              jsx: "react-jsx",
            },
          },
        ],
      },
    },
  ],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/components/**/*.tsx",
    "!src/**/*.d.ts",
  ],
};

export default config;
