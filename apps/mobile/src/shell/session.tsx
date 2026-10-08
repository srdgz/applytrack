import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { SessionMode } from "../di/booted";
import type { UseCases } from "../di/use-cases";

export type Notice =
  { readonly kind: "signedIn"; readonly email: string } | { readonly kind: "signedOut" };

export interface Session {
  readonly useCases: UseCases;
  readonly mode: SessionMode;
  readonly setMode: (mode: SessionMode) => void;
  readonly restart: (notice?: Notice) => void;
}

const SessionContext = createContext<Session | null>(null);

export const SessionProvider = ({
  value,
  children,
}: {
  readonly value: Session;
  readonly children: ReactNode;
}) => <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;

export const useSession = (): Session => {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionProvider is missing");
  return session;
};

export const useUseCases = (): UseCases => useSession().useCases;
