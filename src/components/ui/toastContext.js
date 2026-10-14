import { createContext, useContext } from 'react';

// Shared by every admin page: const toast = useToast(); toast.error('...')
export const ToastContext = createContext(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
