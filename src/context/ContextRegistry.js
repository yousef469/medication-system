import { createContext } from 'react';

const _registry = {
    auth: null,
    clinical: null,
    lang: null,
    theme: null
};

export const getAuthContext = () => {
    if (!_registry.auth) _registry.auth = createContext();
    return _registry.auth;
};

export const getClinicalContext = () => {
    if (!_registry.clinical) _registry.clinical = createContext();
    return _registry.clinical;
};

export const getLanguageContext = () => {
    if (!_registry.lang) _registry.lang = createContext();
    return _registry.lang;
};

export const getThemeContext = () => {
    if (!_registry.theme) _registry.theme = createContext();
    return _registry.theme;
};
