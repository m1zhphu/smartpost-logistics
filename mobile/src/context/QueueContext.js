import React, { createContext, useState, useContext } from 'react';

const QueueContext = createContext();

export const QueueProvider = ({ children }) => {
    const [queue, setQueue] = useState([]);

    const addToQueue = (uri) => {
        const newItem = {
            id: Date.now(),
            uri: uri,
            status: 'loading',
            errorType: null,
            data: null
        };
        setQueue(prev => [newItem, ...prev]);
        return newItem;
    };

    const updateQueueItem = (id, updates) => {
        setQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const removeQueueItem = (id) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const clearQueue = () => {
        setQueue([]);
    };

    return (
        <QueueContext.Provider value={{ queue, addToQueue, updateQueueItem, removeQueueItem, clearQueue }}>
            {children}
        </QueueContext.Provider>
    );
};

export const useQueue = () => useContext(QueueContext);