export type AssetStatus = 'in-use' | 'broken' | 'repairing' | 'disposed';

export type AssetHistory = {
  status: AssetStatus;
  date: string;
};

export type Asset = {
  id: string; // Firestore document ID
  code: string; // Human-readable code e.g., 'Ghế-0001'
  name: string;
  roomId: string;
  status: AssetStatus;
  dateAdded: string;
  history: AssetHistory[];
};

export type Room = {
  id: string;
  name: string;
  manager: string;
};
