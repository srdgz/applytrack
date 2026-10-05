import type { Brand } from "./brand";

export type UserId = Brand<string, "UserId">;
export type ApplicationId = Brand<string, "ApplicationId">;

export const toUserId = (value: string): UserId => value as UserId;
export const toApplicationId = (value: string): ApplicationId => value as ApplicationId;
