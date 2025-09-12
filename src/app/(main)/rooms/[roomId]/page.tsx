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
} from 'lucide-react';

import { getRoomById, getAssetsByRoomId } from '@/lib/mock-data';
import type { Asset, Room } from '@/lib/types';

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
  SheetClose
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
import { CalendarDays } from 'lucide-react';

const addAssetSchema = z.object({
  name: z.string().min(2, { message: 'Tên tài sản phải có ít nhất 2 ký tự' }),
  quantity: z.coerce.number().int().min(1, { message: 'Số lượng phải ít nhất là 1' }),
});

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
        <h2 className="text-lg font-semibold">Tài sản ({assets.length})</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Xuất PDF
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
       <div className="md:hidden space-y-3">
          {assets.length > 0 ? (
              assets.map((asset) => (
                <Link href={`/assets/${asset.id}`} key={asset.id}>
                  <Card className="bg-background hover:bg-accent transition-colors">
                      <CardContent className="pt-4 space-y-2 text-sm">
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
