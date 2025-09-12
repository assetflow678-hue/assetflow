'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, User, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { initialRooms, getAssetsByRoomId } from '@/lib/mock-data';
import type { Room } from '@/lib/types';

const addRoomSchema = z.object({
  name: z.string().min(3, { message: 'Tên phòng phải có ít nhất 3 ký tự' }),
  manager: z.string().min(3, { message: 'Tên người quản lý phải có ít nhất 3 ký tự' }),
});

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addRoomSchema>>({
    resolver: zodResolver(addRoomSchema),
    defaultValues: {
      name: '',
      manager: '',
    },
  });

  function onSubmit(values: z.infer<typeof addRoomSchema>) {
    const newRoom: Room = {
      id: `R${Math.floor(100 + Math.random() * 900)}`,
      ...values,
    };
    setRooms((prev) => [newRoom, ...prev]);
    toast({
      title: 'Thành công!',
      description: `Phòng "${values.name}" đã được thêm.`,
    });
    form.reset();
    setSheetOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline">Danh sách phòng</h1>
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm phòng
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Thêm phòng mới</SheetTitle>
              <SheetDescription>
                Nhập thông tin chi tiết để thêm một phòng mới vào hệ thống.
              </SheetDescription>
            </SheetHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-8">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên phòng</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Phòng họp A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Người quản lý</FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Nguyễn Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Hủy</Button>
                    </SheetClose>
                    <Button type="submit">Thêm phòng</Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Link href={`/rooms/${room.id}`} key={room.id}>
            <Card className="h-full hover:bg-accent transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Warehouse className="h-5 w-5 text-primary" />
                  {room.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1 text-xs">
                  <User className="h-4 w-4" />
                  {room.manager}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Số lượng tài sản:{' '}
                  <span className="font-bold text-foreground">
                    {getAssetsByRoomId(room.id).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
