import { createContext, useContext } from 'react';
import en from './en';

export const LOCALES = ['en', 'ru'];

export const LocaleContext = createContext({ locale: 'en', setLocale: () => {}, t: en });

export const useLocale = () => useContext(LocaleContext);
