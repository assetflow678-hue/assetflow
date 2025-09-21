'use server';

import {
    addRoom,
    updateRoom,
    deleteRoom,
    addAssets,
    updateAssetStatus,
    moveAsset,
    getAssetById,
    deleteAsset,
    updateAssetName,
} from "@/lib/firestore-data";
import type { Asset, AssetStatus, Room } from "@/lib/types";
import { revalidatePath } from "next/cache";

// Room Actions
export async function addRoomAction(data: { name: string; manager: string }) {
    const result = await addRoom(data);
    if (result.success) {
        revalidatePath('/rooms');
    }
    return result;
}

export async function updateRoomAction(roomId: string, data: { name: string; manager: string }) {
    const result = await updateRoom(roomId, data);
    if (result.success) {
        revalidatePath('/rooms');
        revalidatePath(`/rooms/${roomId}`);
    }
    return result;
}

export async function deleteRoomAction(roomId: string) {
    const result = await deleteRoom(roomId);
    if (result.success) {
        revalidatePath('/rooms');
    }
    return result;
}


// Asset Actions
export async function addAssetsAction(roomId: string, assetName: string, quantity: number) {
    const result = await addAssets(roomId, assetName, quantity);
    if (result.success) {
        revalidatePath(`/rooms/${roomId}`);
    }
    return result;
}


export async function updateAssetStatusAction(assetId: string, newStatus: AssetStatus) {
    const result = await updateAssetStatus(assetId, newStatus);
    if (result.success) {
        revalidatePath(`/assets/${encodeURIComponent(assetId)}`);
        const asset = await getAssetById(assetId);
        if (asset) {
           revalidatePath(`/rooms/${asset.roomId}`);
        }
    }
    return result;
}

export async function moveAssetAction(assetId: string, newRoomId: string) {
    const oldAsset = await getAssetById(assetId);
    if (!oldAsset) {
        return { success: false, message: "Asset not found" };
    }
    const oldRoomId = oldAsset.roomId;

    const result = await moveAsset(assetId, newRoomId);

    if (result.success) {
        revalidatePath(`/assets/${encodeURIComponent(assetId)}`);
        revalidatePath(`/rooms/${oldRoomId}`);
        revalidatePath(`/rooms/${newRoomId}`);
    }
    return result;
}

export async function deleteAssetAction(assetId: string) {
    const asset = await getAssetById(assetId);
    if (!asset) {
        return { success: false, message: "Asset not found" };
    }
    const roomId = asset.roomId;
    const result = await deleteAsset(assetId);
    if (result.success) {
        revalidatePath(`/rooms/${roomId}`);
    }
    return { ...result, roomId }; // Return roomId for redirection
}

export async function updateAssetNameAction(assetId: string, newName: string) {
    const result = await updateAssetName(assetId, newName);
    if (result.success) {
        revalidatePath(`/assets/${encodeURIComponent(assetId)}`);
        const asset = await getAssetById(assetId);
        if (asset) {
           revalidatePath(`/rooms/${asset.roomId}`);
        }
    }
    return result;
}
