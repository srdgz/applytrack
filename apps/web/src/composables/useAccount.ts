import { useUseCases } from "../di/use-cases";
import { useHardNavigation } from "./useHardNavigation";
import { rememberNotice } from "./useNotice";

export const useAccount = () => {
  const { account, signOut } = useUseCases();
  const navigate = useHardNavigation();

  const leave = async (): Promise<void> => {
    rememberNotice({ kind: "signedOut" });
    await signOut.execute();
    navigate("/");
  };

  return { account, signOut: leave };
};
