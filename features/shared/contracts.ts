export type ActionState<T = undefined> = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
};

export const initialActionState: ActionState = { status: "idle" };
