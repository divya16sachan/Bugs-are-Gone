// Feature-scoped query keys (no global keys file — each feature owns its own).
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};
