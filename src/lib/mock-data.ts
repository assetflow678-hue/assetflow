import type { Room, Asset } from './types';

export const initialRooms: Room[] = [
  { id: 'R101', name: 'Phòng Họp A', manager: 'Nguyễn Văn A' },
  { id: 'R102', name: 'Văn phòng Marketing', manager: 'Trần Thị B' },
  { id: 'R201', name: 'Phòng Kỹ thuật', manager: 'Lê Văn C' },
];

export const initialAssets: Asset[] = [
  {
    id: 'R101-CHAIR-0001',
    name: 'Ghế xoay',
    roomId: 'R101',
    status: 'in-use',
    dateAdded: '2023-10-01',
    history: [{ status: 'in-use', date: '2023-10-01' }],
  },
  {
    id: 'R101-TABLE-0001',
    name: 'Bàn họp',
    roomId: 'R101',
    status: 'in-use',
    dateAdded: '2023-10-01',
    history: [{ status: 'in-use', date: '2023-10-01' }],
  },
  {
    id: 'R102-PC-0001',
    name: 'Máy tính Dell',
    roomId: 'R102',
    status: 'broken',
    dateAdded: '2023-09-15',
    history: [
      { status: 'in-use', date: '2023-09-15' },
      { status: 'broken', date: '2024-05-10' },
    ],
  },
  {
    id: 'R102-PC-0002',
    name: 'Máy tính Dell',
    roomId: 'R102',
    status: 'in-use',
    dateAdded: '2023-09-15',
    history: [{ status: 'in-use', date: '2023-09-15' }],
  },
  {
    id: 'R201-TOOL-0001',
    name: 'Bộ dụng cụ',
    roomId: 'R201',
    status: 'repairing',
    dateAdded: '2023-08-20',
    history: [
      { status: 'in-use', date: '2023-08-20' },
      { status: 'repairing', date: '2024-05-20' },
    ],
  },
];

export const getRooms = () => initialRooms;
export const getRoomById = (id: string) => initialRooms.find(r => r.id === id);
export const getAssets = () => initialAssets;
export const getAssetsByRoomId = (roomId: string) => initialAssets.filter(a => a.roomId === roomId);
export const getAssetById = (id: string) => initialAssets.find(a => a.id === id);
