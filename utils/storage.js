/**
 * Storage Utility Functions
 * Provides helpers for reading/writing JSON data to LocalStorage
 * 
 * TODO: To swap to Firestore/Realtime Database:
 * 1. Replace localStorage.getItem/setItem calls with Firestore getDoc/setDoc
 * 2. Update functions to be async/await
 * 3. Add error handling for network issues
 * 4. Consider real-time listeners for live updates
 */

(function(window) {
    'use strict';

    /**
     * Get data from LocalStorage by key
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed JSON data or defaultValue
     */
    function getStorageData(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error);
            return defaultValue;
        }
    }

    /**
     * Save data to LocalStorage
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    function setStorageData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please clear some data.');
            }
            return false;
        }
    }

    /**
     * Remove data from LocalStorage
     * @param {string} key - Storage key
     */
    function removeStorageData(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error);
        }
    }

    /**
     * Get array from LocalStorage, return empty array if not found
     * @param {string} key - Storage key
     * @returns {Array} Array of items
     */
    function getStorageArray(key) {
        const data = getStorageData(key, []);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Add item to array in LocalStorage
     * @param {string} key - Storage key
     * @param {*} item - Item to add
     * @returns {boolean} Success status
     */
    function addToStorageArray(key, item) {
        const array = getStorageArray(key);
        array.push(item);
        return setStorageData(key, array);
    }

    /**
     * Update item in array by ID field
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @param {Object} updates - Properties to update
     * @returns {boolean} Success status
     */
    function updateStorageArrayItem(key, id, updates) {
        const array = getStorageArray(key);
        const index = array.findIndex(item => item.id === id);
        if (index === -1) {
            return false;
        }
        array[index] = { ...array[index], ...updates };
        return setStorageData(key, array);
    }

    /**
     * Remove item from array by ID
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @returns {boolean} Success status
     */
    function removeFromStorageArray(key, id) {
        const array = getStorageArray(key);
        const filtered = array.filter(item => item.id !== id);
        return setStorageData(key, filtered);
    }

    /**
     * Find item in array by ID
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @returns {*} Found item or null
     */
    function findStorageArrayItem(key, id) {
        const array = getStorageArray(key);
        return array.find(item => item.id === id) || null;
    }

    // Export functions to window object
    window.StorageUtils = {
        get: getStorageData,
        set: setStorageData,
        remove: removeStorageData,
        getArray: getStorageArray,
        addToArray: addToStorageArray,
        updateArrayItem: updateStorageArrayItem,
        removeFromArray: removeFromStorageArray,
        findArrayItem: findStorageArrayItem
    };

})(window);

