import { describeApplicationRepositoryContract } from "./application-repository-contract";
import { InMemoryApplicationRepository } from "./in-memory-application-repository";

describeApplicationRepositoryContract(
  "InMemoryApplicationRepository",
  () => new InMemoryApplicationRepository(),
);
