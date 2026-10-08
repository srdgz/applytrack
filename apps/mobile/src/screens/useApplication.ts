import type { ApplicationSnapshot } from "@applytrack/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { useUseCases } from "../shell/session";

export type ApplicationState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly application: ApplicationSnapshot }
  | { readonly kind: "notFound" }
  | { readonly kind: "error" };

export const useApplication = (id: string) => {
  const { getApplication } = useUseCases();
  const [state, setState] = useState<ApplicationState>({ kind: "loading" });
  const request = useRef(0);

  const load = useCallback(async () => {
    const current = ++request.current;
    try {
      const result = await getApplication.execute({ id });
      if (current !== request.current) return;
      if (result.ok) setState({ kind: "ready", application: result.value });
      else setState({ kind: result.error.code === "APPLICATION_NOT_FOUND" ? "notFound" : "error" });
    } catch {
      if (current === request.current) setState({ kind: "error" });
    }
  }, [getApplication, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return {
    state,
    reload: load,
    replace: (application: ApplicationSnapshot) => {
      setState({ kind: "ready", application });
    },
  };
};
