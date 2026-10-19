import { createContext, useContext } from "react";

// const confirm = useConfirm(); if (!(await confirm({ title, message }))) return;
export const ConfirmContext = createContext(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
    return context;
}
