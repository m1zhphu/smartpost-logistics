import React, { createContext, useState, useContext } from 'react';

const QueueContext = createContext();

export const QueueProvider = ({ children }) => {
    const [queue, setQueue] = useState([]);

    const addToQueue = (uri, meta = {}) => {
        const newItem = {
            // SỬA ĐỔI: Cộng thêm chuỗi ngẫu nhiên vào sau Date.now() 
            // để đảm bảo ID sinh ra trong vòng lặp forEach không bao giờ bị trùng nhau
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            uri: uri,
            status: 'loading',
            errorType: null,
            data: null,
            ...meta
            // Thuộc tính batchId sẽ được HomeScreen tự động cập nhật ngay sau khi gọi hàm này
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
