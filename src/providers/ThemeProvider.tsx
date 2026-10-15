import React, { useState, createContext, useMemo } from "react";
import { Palette, palettes } from "@/theme/colors";
type ColorScheme = 'dark' | 'light';

type ThemeContextType = {
    tema: ColorScheme
    setTema: (tema: ColorScheme) => void
    paleta: Palette
}


export const ThemeContext = createContext<ThemeContextType | null>(null)



type ThemeProviderProps = {
    children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [tema, setTema] = useState<ColorScheme>('dark');

    const values = useMemo(() => {
        return {
            tema,
            setTema,
            paleta: palettes[tema]
        };
    }, [tema]);


    // const values: ThemeContextType = {
    //     tema,
    //     setTema,
    //     paleta: palettes[tema] 
    // }

    return <ThemeContext.Provider value={values}>{children}</ThemeContext.Provider>
}