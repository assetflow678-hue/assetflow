'use server';

import { initialAssets } from "@/lib/mock-data";
import type { Asset, AssetStatus } from "@/lib/types";

export async function updateAssetStatus(assetId: string, newStatus: AssetStatus) {
    console.log(`Updating status for ${assetId} to ${newStatus}`);
    const assetIndex = initialAssets.findIndex(a => a.id === assetId);

    if (assetIndex !== -1) {
        const newHistoryEntry = { status: newStatus, date: new Date().toISOString().split('T')[0] };
        initialAssets[assetIndex].status = newStatus;
        initialAssets[assetIndex].history.push(newHistoryEntry);
        console.log('Update successful');
        return { success: true, asset: initialAssets[assetIndex] };
    }
    console.log('Asset not found');
    return { success: false, message: 'Asset not found' };
}

export async function moveAsset(assetId: string, newRoomId: string) {
    console.log(`Moving ${assetId} to ${newRoomId}`);
    const assetIndex = initialAssets.findIndex(a => a.id === assetId);

    if (assetIndex !== -1) {
        initialAssets[assetIndex].roomId = newRoomId;
        console.log('Move successful');
        return { success: true, asset: initialAssets[assetIndex] };
    }
    console.log('Asset not found');
    return { success: false, message: 'Asset not found' };
}
