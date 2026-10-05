import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  FIELD_ERROR_CODES,
  USE_CASE_ERROR_CODES,
  WORK_MODES,
} from "@applytrack/core";
import { IntlMessageFormat } from "intl-messageformat";
import { describe, expect, it } from "vitest";

import type { Locale } from "./index";
import { messages, resolveLocale, SUPPORTED_LOCALES } from "./index";

type Tree = { readonly [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ""): Map<string, string> => {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") entries.set(path, value);
    else for (const [nested, text] of flatten(value, path)) entries.set(nested, text);
  }
  return entries;
};

const ARGUMENT_TYPES = new Set([1, 2, 3, 4, 5, 6]);

const argumentNames = (nodes: readonly object[]): string[] => {
  const names = new Set<string>();
  const visit = (node: object) => {
    if ("type" in node && ARGUMENT_TYPES.has(node.type as number) && "value" in node) {
      names.add(String(node.value));
    }
    if ("options" in node && typeof node.options === "object" && node.options !== null) {
      for (const option of Object.values(node.options as Record<string, { value: object[] }>)) {
        option.value.forEach(visit);
      }
    }
  };
  nodes.forEach(visit);
  return [...names].sort();
};

const catalogs = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, flatten(messages[locale])]),
) as Record<Locale, Map<string, string>>;

describe("catálogos", () => {
  it("español e inglés tienen exactamente las mismas claves", () => {
    expect([...catalogs.en.keys()].sort()).toEqual([...catalogs.es.keys()].sort());
  });

  it.each(SUPPORTED_LOCALES)("ningún texto está vacío en %s", (locale) => {
    for (const [key, text] of catalogs[locale]) {
      expect(text.trim(), key).not.toBe("");
    }
  });

  it.each(SUPPORTED_LOCALES)("todos los mensajes de %s son ICU válidos", (locale) => {
    for (const [key, text] of catalogs[locale]) {
      expect(() => new IntlMessageFormat(text, locale), key).not.toThrow();
    }
  });

  it.each(SUPPORTED_LOCALES)("los mensajes de %s usan las mismas variables", (locale) => {
    const variables = (text: string) => argumentNames(new IntlMessageFormat(text).getAst());
    for (const [key, text] of catalogs.es) {
      expect(variables(catalogs[locale].get(key) ?? ""), key).toEqual(variables(text));
    }
  });

  it.each(SUPPORTED_LOCALES)("todos los códigos de core tienen traducción en %s", (locale) => {
    const catalog = catalogs[locale];
    const required = [
      ...APPLICATION_STATUSES.map((status) => `status.${status}`),
      ...WORK_MODES.map((mode) => `workMode.${mode}`),
      ...APPLICATION_SOURCES.map((source) => `source.${source}`),
      ...FIELD_ERROR_CODES.map((code) => `errors.${code}`),
      ...USE_CASE_ERROR_CODES.map((code) => `errors.${code}`),
    ];

    expect(required.filter((key) => !catalog.has(key))).toEqual([]);
  });
});

describe("resolveLocale", () => {
  it.each([
    [["es-ES", "en"], "es"],
    [["EN-gb"], "en"],
    [["fr-FR", "es"], "es"],
    [["fr", "de"], "en"],
    [[null, undefined, ""], "en"],
  ])("%o → %s", (candidates, expected) => {
    expect(resolveLocale(candidates)).toBe(expected);
  });
});
