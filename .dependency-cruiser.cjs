// Reglas de dependencia de la arquitectura hexagonal.
// Ver docs/specs/001-arquitectura.md, sección 6.

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment: "El dominio no importa nada de fuera del dominio.",
      severity: "error",
      from: { path: "^packages/core/src/domain/" },
      to: { pathNot: ["^packages/core/src/domain/"] },
    },
    {
      name: "application-only-domain",
      comment: "La capa de aplicación solo importa dominio y aplicación.",
      severity: "error",
      from: { path: "^packages/core/src/application/" },
      to: { pathNot: ["^packages/core/src/(domain|application)/"] },
    },
    {
      name: "core-no-frameworks",
      comment: "core no depende de ningún paquete de npm ni de módulos de Node.",
      severity: "error",
      from: { path: "^packages/core/src/", pathNot: "\.test\.ts$" },
      to: {
        dependencyTypes: [
          "npm",
          "npm-dev",
          "npm-optional",
          "npm-peer",
          "npm-no-pkg",
          "npm-unknown",
          "core",
        ],
      },
    },
    {
      name: "adapters-only-core",
      comment: "Un adaptador no importa otro adaptador ni una app.",
      severity: "error",
      from: { path: "^packages/adapter-([^/]+)/" },
      to: { path: ["^packages/adapter-", "^apps/"], pathNot: "^packages/adapter-$1/" },
    },
    {
      name: "ui-no-adapters",
      comment: "En las apps, solo la raíz de composición (src/di) importa adaptadores.",
      severity: "error",
      from: { path: "^apps/[^/]+/src/", pathNot: "^apps/[^/]+/src/di/" },
      to: { path: ["^packages/adapter-", "node_modules/@applytrack/adapter-"] },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: ["(^|/)(dist|coverage|\.turbo)/", "\.config\.(ts|js|cjs)$"] },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    preserveSymlinks: false,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".vue", ".js", ".json"],
    },
  },
};
