import { createContext } from 'react';

// Centralized Context Objects to ensure safe evaluation order
export const AuthContext = createContext();
export const ClinicalContext = createContext();
export const LanguageContext = createContext();
export const ThemeContext = createContext();
