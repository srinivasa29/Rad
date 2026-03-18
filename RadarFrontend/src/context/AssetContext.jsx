import React, { createContext, useContext, useState } from 'react';

const AssetContext = createContext(null);
const DEFAULT_REGION = String(import.meta.env.VITE_DEFAULT_REGION || 'IN').toUpperCase();
const DEFAULT_SYMBOL_BY_REGION = {
    IN: 'RELIANCE.NS',
    US: 'AAPL',
    GLOBAL: 'NIFTY',
};

export const AssetProvider = ({ children }) => {
    const [activeSymbol, setActiveSymbol] = useState(DEFAULT_SYMBOL_BY_REGION[DEFAULT_REGION] || DEFAULT_SYMBOL_BY_REGION.IN);
    const [activeType, setActiveType] = useState('stock');

    const setAsset = (symbol, type = 'stock') => {
        setActiveSymbol(symbol);
        setActiveType(type);
    };

    return (
        <AssetContext.Provider value={{
            activeSymbol,
            activeType,
            setAsset
        }}>
            {children}
        </AssetContext.Provider>
    );
};

export const useAsset = () => {
    const context = useContext(AssetContext);
    if (!context) {
        throw new Error("useAsset must be used within an AssetProvider");
    }
    return context;
};
