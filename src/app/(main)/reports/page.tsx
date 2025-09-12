import { getRooms, getAssets } from '@/lib/mock-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Asset } from '@/lib/types';

function StatusBadge({ status }: { status: Asset['status'] }) {
    const variant: "default" | "secondary" | "destructive" | "outline" =
      status === 'in-use' ? 'default'
      : status === 'broken' ? 'destructive'
      : status === 'repairing' ? 'outline'
      : 'secondary';
    
    const text =
      status === 'in-use' ? 'Đang sử dụng'
      : status === 'broken' ? 'Bị hỏng'
      : status === 'repairing' ? 'Đang sửa'
      : 'Đã loại bỏ';
  
    return <Badge variant={variant}>{text}</Badge>;
}

export default function ReportsPage() {
  const rooms = getRooms();
  const allAssets = getAssets();
  const assetsByRoom = rooms.map(room => ({
    ...room,
    assets: allAssets.filter(asset => asset.roomId === room.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">Báo cáo tài sản</h1>
        <div className="flex gap-2">
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Tải CSV</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Tải PDF</Button>
        </div>
      </div>

      <div className="space-y-8">
        {assetsByRoom.map(roomData => (
            <div key={roomData.id}>
                <h2 className="text-lg font-semibold mb-2">{roomData.name} ({roomData.assets.length} tài sản)</h2>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Mã tài sản</TableHead>
                            <TableHead>Tên tài sản</TableHead>
                            <TableHead>Ngày thêm</TableHead>
                            <TableHead>Tình trạng</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {roomData.assets.length > 0 ? (
                            roomData.assets.map((asset) => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-medium">{asset.id}</TableCell>
                                <TableCell>{asset.name}</TableCell>
                                <TableCell>{asset.dateAdded}</TableCell>
                                <TableCell><StatusBadge status={asset.status} /></TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                Phòng này không có tài sản.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
