'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
  SheetFooter,
  SheetClose,
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
import { getRooms } from '@/lib/firestore-data';
import { addRoomAction, updateRoomAction, deleteRoomAction } from '@/app/actions';
import type { Room } from '@/lib/types';
import { SwipeableRoomCard } from '@/components/swipeable-room-card';

const roomSchema = z.object({
  name: z.string().min(3, { message: 'Tên phòng phải có ít nhất 3 ký tự' }),
  manager: z.string().min(3, { message: 'Tên người quản lý phải có ít nhất 3 ký tự' }),
});

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRooms = async () => {
        setLoading(true);
        const roomsData = await getRooms();
        setRooms(roomsData);
        setLoading(false);
    }
    fetchRooms();
  }, []);

  const form = useForm<z.infer<typeof roomSchema>>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      manager: '',
    },
  });

  const handleAddNew = () => {
    setEditingRoom(null);
    form.reset({ name: '', manager: '' });
    setSheetOpen(true);
  };
  
  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    form.reset(room);
    setSheetOpen(true);
  };

  const handleDelete = async (roomId: string) => {
    const result = await deleteRoomAction(roomId);
    if (result.success) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast({
          title: 'Đã xóa!',
          description: `Phòng đã được xóa khỏi hệ thống.`,
      });
    } else {
      toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: result.message || 'Không thể xóa phòng.',
      });
    }
  };

  async function onSubmit(values: z.infer<typeof roomSchema>) {
    if (editingRoom) {
      // Update existing room
      const result = await updateRoomAction(editingRoom.id, values);
      if (result.success && result.updatedRoom) {
        setRooms(prev => prev.map(r => r.id === editingRoom.id ? result.updatedRoom! : r));
        toast({
          title: 'Thành công!',
          description: `Thông tin phòng "${values.name}" đã được cập nhật.`,
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: result.message || 'Không thể cập nhật phòng.',
        });
      }
    } else {
      // Add new room
      const result = await addRoomAction(values);
       if (result.success && result.newRoom) {
        setRooms((prev) => [result.newRoom!, ...prev]);
        toast({
            title: 'Thành công!',
            description: `Phòng "${values.name}" đã được thêm.`,
        });
      } else {
         toast({
          variant: 'destructive',
          title: 'Lỗi!',
          description: result.message || 'Không thể thêm phòng.',
        });
      }
    }

    form.reset();
    setSheetOpen(false);
    setEditingRoom(null);
  }

  if (loading) {
    return <div>Đang tải danh sách phòng...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline">Danh sách phòng</h1>
        <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
            setSheetOpen(isOpen);
            if (!isOpen) setEditingRoom(null);
        }}>
          <SheetTrigger asChild>
            <Button size="sm" onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm phòng
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</SheetTitle>
              <SheetDescription>
                {editingRoom
                    ? 'Cập nhật thông tin chi tiết của phòng.'
                    : 'Nhập thông tin chi tiết để thêm một phòng mới vào hệ thống.'
                }
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
                    <Button type="submit">{editingRoom ? 'Lưu thay đổi' : 'Thêm phòng'}</Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
           <SwipeableRoomCard 
             key={room.id}
             room={room}
             onEdit={() => handleEdit(room)}
             onDelete={() => handleDelete(room.id)}
           />
        ))}
      </div>
    </div>
  );
}
