import { createContext, useContext } from 'react';

/**
 * The core Authentication Context object.
 * Created here to avoid mixing component and non-component exports in AuthContext.jsx.
 */
export const AuthContext = createContext(null);

/**
 * Custom hook to access the authentication context.
 * Exported from this logic-only file to maintain Fast Refresh stability.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
