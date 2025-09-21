import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    writeBatch,
    runTransaction,
    setDoc,
    getCountFromServer,
} from 'firebase/firestore';
import type { Room, Asset, AssetStatus } from './types';

const ROOMS_COLLECTION = 'rooms';
const ASSETS_COLLECTION = 'assets';

// Helper to convert Firestore doc to Room object
const toRoomObject = (doc: any): Room => ({
    id: doc.id,
    name: doc.data().name,
    manager: doc.data().manager,
});

// Helper to convert Firestore doc to Asset object
const toAssetObject = (doc: any): Asset => ({
    id: doc.id,
    ...doc.data(),
} as Asset);

// Room Functions
export const getRooms = async (): Promise<Room[]> => {
    try {
        const snapshot = await getDocs(collection(db, ROOMS_COLLECTION));
        return snapshot.docs.map(toRoomObject);
    } catch (error) {
        console.error("Error fetching rooms: ", error);
        return [];
    }
};

export const getRoomById = async (id: string): Promise<Room | null> => {
     if (!id) return null;
    try {
        const docRef = doc(db, ROOMS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? toRoomObject(docSnap) : null;
    } catch (error) {
        console.error(`Error fetching room ${id}: `, error);
        return null;
    }
};

export const addRoom = async (data: { name: string; manager: string }): Promise<{ success: boolean; newRoom?: Room; message?: string }> => {
    try {
        const docRef = await addDoc(collection(db, ROOMS_COLLECTION), data);
        const newRoom = { id: docRef.id, ...data };
        return { success: true, newRoom };
    } catch (error) {
        console.error("Error adding room: ", error);
        return { success: false, message: 'Failed to add room.' };
    }
};

export const updateRoom = async (roomId: string, data: { name: string; manager: string }): Promise<{ success: boolean; updatedRoom?: Room; message?: string }> => {
    try {
        const docRef = doc(db, ROOMS_COLLECTION, roomId);
        await updateDoc(docRef, data);
        const updatedRoom = { id: roomId, ...data };
        return { success: true, updatedRoom };
    } catch (error) {
        console.error(`Error updating room ${roomId}: `, error);
        return { success: false, message: 'Failed to update room.' };
    }
};

export const deleteRoom = async (roomId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        await deleteDoc(doc(db, ROOMS_COLLECTION, roomId));
        const assetsQuery = query(collection(db, ASSETS_COLLECTION), where("roomId", "==", roomId));
        const assetsSnapshot = await getDocs(assetsQuery);
        const batch = writeBatch(db);
        assetsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error(`Error deleting room ${roomId}: `, error);
        return { success: false, message: 'Failed to delete room.' };
    }
};


// Asset Functions
export const getAssetsByRoomId = async (roomId: string): Promise<Asset[]> => {
    try {
        const q = query(collection(db, ASSETS_COLLECTION), where('roomId', '==', roomId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(toAssetObject);
    } catch (error) {
        console.error(`Error fetching assets for room ${roomId}: `, error);
        return [];
    }
};

export const getAssetById = async (id: string): Promise<Asset | null> => {
    if (!id) return null;
    try {
        const docRef = doc(db, ASSETS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? toAssetObject(docSnap) : null;
    } catch (error) {
        console.error(`Error fetching asset ${id}: `, error);
        return null;
    }
};

export const addAssets = async (roomId: string, assetName: string, quantity: number): Promise<{ success: boolean; newAssets?: Asset[]; message?: string }> => {
    const newAssets: Asset[] = [];
    
    try {
        const roomDoc = await getRoomById(roomId);
        if (!roomDoc) {
             return { success: false, message: "Room not found." };
        }
        
        await runTransaction(db, async (transaction) => {
            const assetsCollection = collection(db, ASSETS_COLLECTION);
            const q = query(assetsCollection, where("name", "==", assetName));
            const querySnapshot = await getDocs(q);
            let currentCount = querySnapshot.size;

            for (let i = 0; i < quantity; i++) {
                const serialNumber = currentCount + i + 1;
                const assetCode = `${assetName}-${serialNumber.toString().padStart(4, '0')}`;
                const newAssetRef = doc(collection(db, ASSETS_COLLECTION));
                
                const dateAdded = new Date().toISOString().split('T')[0];
                const newAssetData = {
                    code: assetCode,
                    name: assetName,
                    roomId: roomId,
                    status: 'in-use' as AssetStatus,
                    dateAdded: dateAdded,
                    history: [{ status: 'in-use' as AssetStatus, date: dateAdded }],
                };
                
                transaction.set(newAssetRef, newAssetData);
                newAssets.push({ id: newAssetRef.id, ...newAssetData });
            }
        });

        return { success: true, newAssets };

    } catch (error) {
        console.error(`Error adding assets to room ${roomId}: `, error);
        return { success: false, message: 'Failed to add assets.' };
    }
};


export const updateAssetStatus = async (assetId: string, newStatus: AssetStatus): Promise<{ success: boolean; asset?: Asset, message?: string }> => {
     try {
        const assetRef = doc(db, ASSETS_COLLECTION, assetId);
        const newHistoryEntry = { status: newStatus, date: new Date().toISOString().split('T')[0] };

        const updatedAsset = await runTransaction(db, async (transaction) => {
            const assetDoc = await transaction.get(assetRef);
            if (!assetDoc.exists()) {
                throw "Asset does not exist!";
            }
            const oldHistory = assetDoc.data().history || [];
            const newHistory = [...oldHistory, newHistoryEntry];
            transaction.update(assetRef, { status: newStatus, history: newHistory });
            
            return { id: assetId, ...assetDoc.data(), status: newStatus, history: newHistory } as Asset;
        });
        
        return { success: true, asset: updatedAsset };
    } catch (error) {
        console.error(`Error updating asset status ${assetId}: `, error);
        return { success: false, message: 'Failed to update asset status.' };
    }
};


export const moveAsset = async (assetId: string, newRoomId: string): Promise<{ success: boolean; asset?: Asset, message?: string }> => {
    try {
        const assetRef = doc(db, ASSETS_COLLECTION, assetId);

        // Check if the new room exists
        const roomRef = doc(db, ROOMS_COLLECTION, newRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) {
            return { success: false, message: "Target room does not exist." };
        }

        await updateDoc(assetRef, { roomId: newRoomId });
        const updatedDoc = await getDoc(assetRef);
        const updatedAsset = toAssetObject(updatedDoc);

        return { success: true, asset: updatedAsset };
    } catch (error) {
        console.error(`Error moving asset ${assetId}: `, error);
        return { success: false, message: 'Failed to move asset.' };
    }
};
