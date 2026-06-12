export type ActionState = {
  success: boolean;
  error?: string;
};

export const initialActionState: ActionState = { success: false };
