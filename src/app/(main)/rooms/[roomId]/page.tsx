'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import {
  PlusCircle,
  MoreHorizontal,
  ArrowLeft,
  Download,
  CalendarDays,
  QrCode,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { getRoomById, getAssetsByRoomId } from '@/lib/mock-data';
import type { Asset, Room, AssetStatus } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const addAssetSchema = z.object({
  name: z.string().min(2, { message: 'Tên tài sản phải có ít nhất 2 ký tự' }),
  quantity: z.coerce.number().int().min(1, { message: 'Số lượng phải ít nhất là 1' }),
});

const statusTranslations: Record<AssetStatus, string> = {
  'in-use': 'Đang sử dụng',
  'broken': 'Hỏng',
  'repairing': 'Đang sửa',
  'disposed': 'Đã thanh lý',
};

function StatusBadge({ status }: { status: Asset['status'] }) {
  const variant: 'default' | 'secondary' | 'destructive' | 'outline' =
    status === 'in-use' ? 'default'
    : status === 'broken' ? 'destructive'
    : status === 'repairing' ? 'outline'
    : 'secondary';
  
  return <Badge variant={variant}>{statusTranslations[status]}</Badge>;
}

export default function RoomDetailPage() {
  const params = useParams<{ roomId: string }>();
  const roomData = getRoomById(params.roomId);

  const [room] = useState<Room | undefined>(roomData);
  const [assets, setAssets] = useState<Asset[]>(getAssetsByRoomId(params.roomId));
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addAssetSchema>>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      name: '',
      quantity: 1,
    },
  });

  if (!room) {
    return (
      <div>
        <h1>Phòng không tìm thấy</h1>
        <Link href="/rooms">Quay lại danh sách phòng</Link>
      </div>
    );
  }

  function onSubmit(values: z.infer<typeof addAssetSchema>) {
    const newAssets: Asset[] = [];
    const assetTypeCount = assets.filter(a => a.name.toLowerCase() === values.name.toLowerCase()).length;
    const assetCode = values.name.substring(0, 5).toUpperCase();
    
    for (let i = 0; i < values.quantity; i++) {
        const newIndex = (assetTypeCount + i + 1).toString().padStart(4, '0');
        const newAsset: Asset = {
            id: `${room!.id}-${assetCode}-${newIndex}`,
            name: values.name,
            roomId: room!.id,
            status: 'in-use',
            dateAdded: new Date().toISOString().split('T')[0],
            history: [{ status: 'in-use', date: new Date().toISOString().split('T')[0] }],
        };
        newAssets.push(newAsset);
    }

    setAssets(prev => [...newAssets, ...prev]);
    toast({
      title: 'Thành công!',
      description: `${values.quantity} ${values.name} đã được thêm vào phòng ${room.name}.`,
    });
    form.reset();
    setSheetOpen(false);
  }

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.text(`Asset Report - Room: ${room.name}`, 14, 20);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 28);

    (doc as any).autoTable({
        startY: 35,
        head: [['Asset ID', 'Asset Name', 'Date Added', 'Status']],
        body: assets.map(asset => [
            asset.id,
            asset.name,
            asset.dateAdded,
            asset.status
        ]),
        headStyles: { fillColor: [35, 87, 52] }, // Primary color
    });

    doc.save(`asset-report-${room.id}.pdf`);
  };

  const handleExportQRCodesPDF = async () => {
    const doc = new jsPDF();
    doc.text(`QR Codes for Room: ${room.name}`, 14, 20);

    const qrCodeSize = 50; // mm
    const labelHeight = 10; // mm for the text below QR
    const itemHeight = qrCodeSize + labelHeight;
    const margin = 10; // mm
    const itemsPerRow = 3;
    const itemsPerPage = 8;
    const colWidth = (doc.internal.pageSize.getWidth() - 2 * margin) / itemsPerRow;
    let x = margin;
    let y = 30; // Start y position

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        // Add new page if needed
        if (i > 0 && i % itemsPerPage === 0) {
            doc.addPage();
            y = 30;
        }

        const rowIndex = i % itemsPerPage;
        const colIndex = rowIndex % itemsPerRow;

        x = margin + colIndex * colWidth + (colWidth - qrCodeSize) / 2;
        y = 30 + Math.floor(rowIndex / itemsPerRow) * itemHeight;

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://assetflow.app/assets/${asset.id}`)}`;
        
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            
            await new Promise<void>((resolve, reject) => {
                reader.onload = () => {
                    const base64 = reader.result as string;
                    doc.addImage(base64, 'PNG', x, y, qrCodeSize, qrCodeSize);

                    doc.setFontSize(8);
                    doc.text(asset.id, x + qrCodeSize / 2, y + qrCodeSize + 5, { align: 'center' });

                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            
        } catch (error) {
            console.error("Error fetching or adding QR code image:", error);
            // Draw a placeholder if QR fails
            doc.rect(x, y, qrCodeSize, qrCodeSize, 'D');
            doc.text('QR Error', x + qrCodeSize/2, y + qrCodeSize/2, { align: 'center' });
        }
    }

    doc.save(`qr-codes-${room.id}.pdf`);
    toast({ title: 'Đã tạo PDF', description: `Đang tải xuống file PDF chứa mã QR cho phòng ${room.name}` });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href="/rooms">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold font-headline">{room.name}</h1>
          <p className="text-sm text-muted-foreground">Quản lý bởi: {room.manager}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Tài sản ({assets.length})</h2>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Xuất PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportQRCodesPDF}>
            <QrCode className="mr-2 h-4 w-4" />
            Xuất QR (PDF)
          </Button>
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Thêm tài sản vào "{room.name}"</SheetTitle>
                <SheetDescription>
                  Nhập tên và số lượng tài sản cần thêm.
                </SheetDescription>
              </SheetHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên tài sản</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: Ghế xoay" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số lượng</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <SheetFooter>
                      <SheetClose asChild>
                          <Button variant="outline">Hủy</Button>
                      </SheetClose>
                      <Button type="submit">Thêm</Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã tài sản</TableHead>
              <TableHead>Tên tài sản</TableHead>
              <TableHead>Ngày thêm</TableHead>
              <TableHead>Tình trạng</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length > 0 ? (
              assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">
                    <Link href={`/assets/${asset.id}`} className="hover:underline text-sm">{asset.id}</Link>
                  </TableCell>
                  <TableCell className="text-sm">{asset.name}</TableCell>
                  <TableCell className="text-sm">{asset.dateAdded}</TableCell>
                  <TableCell><StatusBadge status={asset.status} /></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/assets/${asset.id}`}>Xem chi tiết</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Chưa có tài sản nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
       <div className="md:hidden space-y-2">
          {assets.length > 0 ? (
              assets.map((asset) => (
                <Link href={`/assets/${asset.id}`} key={asset.id}>
                  <Card className="bg-background hover:bg-accent transition-colors">
                      <CardContent className="p-3 space-y-1.5 text-sm">
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className="font-semibold">{asset.name}</p>
                                  <p className="text-xs text-muted-foreground">{asset.id}</p>
                              </div>
                              <StatusBadge status={asset.status} />
                          </div>
                          <div className="text-muted-foreground text-xs flex items-center gap-2 pt-1">
                              <CalendarDays className="h-3 w-3" />
                              <span>{asset.dateAdded}</span>
                          </div>
                      </CardContent>
                  </Card>
                </Link>
              ))
          ) : (
              <div className="text-center text-sm text-muted-foreground py-10">
                  Chưa có tài sản nào.
              </div>
          )}
      </div>
    </div>
  );
}
