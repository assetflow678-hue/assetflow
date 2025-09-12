'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notFound } from 'next/navigation';
import {
  PlusCircle,
  MoreHorizontal,
  ArrowLeft,
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
  SheetTrigger,
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


export default function RoomDetailPage({ params }: { params: { roomId: string } }) {
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
    notFound();
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
          <h1 className="text-2xl font-bold font-headline">{room.name}</h1>
          <p className="text-muted-foreground">Quản lý bởi: {room.manager}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Danh sách tài sản</h2>
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button>
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

      <div className="rounded-lg border">
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
                    <Link href={`/assets/${asset.id}`} className="hover:underline">{asset.id}</Link>
                  </TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.dateAdded}</TableCell>
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
    </div>
  );
}
