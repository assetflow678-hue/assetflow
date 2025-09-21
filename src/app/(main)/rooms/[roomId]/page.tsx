'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import {
  PlusCircle,
  MoreHorizontal,
  ArrowLeft,
  Download,
  CalendarDays,
  QrCode,
  FilePenLine,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { getRoomById, getAssetsByRoomId } from '@/lib/firestore-data';
import { addAssetsAction } from '@/app/actions';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

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

const RoomDetailSkeleton = () => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-32" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-32" />
            </div>
        </div>
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30%]"><Skeleton className="h-5 w-[80%]" /></TableHead>
                        <TableHead className="w-[30%]"><Skeleton className="h-5 w-[80%]" /></TableHead>
                        <TableHead className="w-[20%]"><Skeleton className="h-5 w-[70%]" /></TableHead>
                        <TableHead className="w-[15%]"><Skeleton className="h-5 w-[90%]" /></TableHead>
                        <TableHead className="w-[5%]"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
);


export default function RoomDetailPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [roomData, assetsData] = await Promise.all([
            getRoomById(params.roomId as string),
            getAssetsByRoomId(params.roomId as string)
        ]);
        if (!roomData) {
            router.push('/rooms');
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không tìm thấy phòng.'});
            return;
        }
        setRoom(roomData);
        setAssets(assetsData);
        setLoading(false);
    }
    fetchData();
  }, [params.roomId, router, toast]);

  const form = useForm<z.infer<typeof addAssetSchema>>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: {
      name: '',
      quantity: 1,
    },
  });

  if (loading) {
    return <RoomDetailSkeleton />;
  }

  if (!room) {
    return (
      <div>
        <h1>Phòng không tìm thấy</h1>
        <Link href="/rooms">Quay lại danh sách phòng</Link>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof addAssetSchema>) {
    const result = await addAssetsAction(room!.id, values.name, values.quantity);
    if (result.success && result.newAssets) {
        setAssets(prev => [...result.newAssets!, ...prev]);
        toast({
          title: 'Thành công!',
          description: `${values.quantity} ${values.name} đã được thêm vào phòng ${room!.name}.`,
        });
        form.reset();
        setSheetOpen(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Lỗi!',
            description: result.message || 'Không thể thêm tài sản.',
        });
    }
  }

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.text(`Báo cáo tài sản - Phòng: ${room.name}`, 14, 20);
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString()}`, 14, 28);

    (doc as any).autoTable({
        startY: 35,
        head: [['Mã tài sản', 'Tên tài sản', 'Ngày thêm', 'Tình trạng']],
        body: assets.map(asset => [
            asset.id,
            asset.name,
            asset.dateAdded,
            statusTranslations[asset.status]
        ]),
        headStyles: { fillColor: [35, 87, 52] }, // Primary color
    });

    doc.save(`baocao-taisan-${room.id}.pdf`);
  };

  const handleExportQRCodesPDF = async () => {
    const doc = new jsPDF();
    doc.text(`Mã QR cho Phòng: ${room.name}`, 14, 20);

    const qrCodeSize = 28; // mm
    const labelHeight = 10; // mm for the text below QR
    const itemHeight = qrCodeSize + labelHeight;
    const margin = 10; // mm
    const itemsPerRow = 6;
    const itemsPerPage = 24;
    const colWidth = (doc.internal.pageSize.getWidth() - 2 * margin) / itemsPerRow;
    
    toast({ title: 'Đang tạo PDF...', description: 'Quá trình này có thể mất một lúc.' });

    const qrCodePromises = assets.map(asset => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          `https://assetflow-three.vercel.app/assets/${encodeURIComponent(asset.id)}`
        )}`;
        return fetch(qrUrl)
            .then(response => response.blob())
            .then(blob => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));
    });

    try {
        const qrCodeBase64s = await Promise.all(qrCodePromises);

        qrCodeBase64s.forEach((base64, i) => {
            const asset = assets[i];
            
            if (i > 0 && i % itemsPerPage === 0) {
                doc.addPage();
                doc.text(`Mã QR cho Phòng: ${room.name} (Trang ${Math.floor(i / itemsPerPage) + 1})`, 14, 20);
            }

            const rowIndex = i % itemsPerPage;
            const colIndex = rowIndex % itemsPerRow;

            const x = margin + colIndex * colWidth + (colWidth - qrCodeSize) / 2;
            const y = 30 + Math.floor(rowIndex / itemsPerRow) * itemHeight;

            doc.addImage(base64, 'PNG', x, y, qrCodeSize, qrCodeSize);
            doc.setFontSize(8);
            doc.text(asset.id, x + qrCodeSize / 2, y + qrCodeSize + 5, { align: 'center' });
        });

        doc.save(`ma-qr-${room.id}.pdf`);
        toast({ title: 'Đã tạo PDF thành công!', description: `Đang tải xuống file PDF cho phòng ${room.name}` });
    } catch (error) {
        console.error("Error generating QR codes PDF:", error);
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tạo file PDF mã QR.' });
    }
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
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-9 p-0">
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Xuất Báo Cáo</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Xuất Báo Cáo</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Danh sách tài sản (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportQRCodesPDF}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Mã QR tài sản (PDF)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>

          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm tài sản
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
                    <Link href={`/assets/${encodeURIComponent(asset.id)}`} className="hover:underline text-sm">{asset.id}</Link>
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
                            <Link href={`/assets/${encodeURIComponent(asset.id)}`}>Xem chi tiết</Link>
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
                <Link href={`/assets/${encodeURIComponent(asset.id)}`} key={asset.id}>
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
