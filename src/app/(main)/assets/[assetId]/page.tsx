'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Home,
  Tag,
  Wrench,
  Move,
  Sparkles,
  Loader2,
  FilePenLine,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getAssetById, getRoomById, getRooms } from '@/lib/mock-data';
import type { Asset, AssetStatus, Room } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedStatus } from '@/app/actions';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

const statusUpdateSchema = z.object({
    status: z.enum(['in-use', 'broken', 'repairing', 'disposed']),
});

const roomMoveSchema = z.object({
    roomId: z.string(),
});

export default function AssetDetailPage() {
  const params = useParams<{ assetId: string }>();
  const assetData = getAssetById(params.assetId);

  const [asset, setAsset] = useState<Asset | undefined>(assetData);
  const { toast } = useToast();

  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [userInput, setUserInput] = useState('');


  if (!asset) {
    notFound();
  }
  const room = getRoomById(asset.roomId);
  const allRooms = getRooms();
  
  const statusUpdateForm = useForm<z.infer<typeof statusUpdateSchema>>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: asset.status },
  });

  const roomMoveForm = useForm<z.infer<typeof roomMoveSchema>>({
    resolver: zodResolver(roomMoveSchema),
    defaultValues: { roomId: asset.roomId },
  });

  const onStatusUpdate = (values: z.infer<typeof statusUpdateSchema>) => {
    const newHistoryEntry = { status: values.status, date: new Date().toISOString().split('T')[0] };
    setAsset(prev => prev ? {...prev, status: values.status, history: [...prev.history, newHistoryEntry]} : undefined);
    toast({ title: 'Thành công', description: 'Trạng thái tài sản đã được cập nhật.' });
  };

  const onRoomMove = (values: z.infer<typeof roomMoveSchema>) => {
    const newRoom = getRoomById(values.roomId);
    setAsset(prev => prev ? {...prev, roomId: values.roomId} : undefined);
    toast({ title: 'Thành công', description: `Tài sản đã được chuyển đến ${newRoom?.name}.` });
  };

  const handleGetAiSuggestion = async () => {
    setAiLoading(true);
    setAiSuggestion('');
    const result = await getSuggestedStatus({
      assetId: asset.id,
      currentStatus: asset.status,
      statusHistory: asset.history.map(h => statusTranslations[h.status as AssetStatus]),
      userInput: userInput,
    });
    setAiLoading(false);
    if (result.success && result.data) {
      setAiSuggestion(result.data.suggestedStatus);
    } else {
      toast({ variant: 'destructive', title: 'Lỗi', description: result.error });
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href={`/rooms/${asset.roomId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold font-headline">{asset.name}</h1>
          <p className="text-sm text-muted-foreground">{asset.id}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 h-full">
          <CardHeader>
            <CardTitle className="text-base">Chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Tên tài sản:</span>
              <span>{asset.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Phòng:</span>
              <Link href={`/rooms/${room?.id}`} className="text-primary hover:underline">{room?.name}</Link>
            </div>
            <div className="flex items-center gap-4">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Ngày thêm:</span>
              <span>{asset.dateAdded}</span>
            </div>
            <div className="flex items-center gap-4">
              <FilePenLine className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Trạng thái:</span>
              <StatusBadge status={asset.status} />
            </div>
            <Separator />
            <div className="space-y-2">
                <h3 className="font-medium text-base">Lịch sử trạng thái</h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                    {asset.history.slice().reverse().map((h, i) => (
                        <li key={i}>{h.date}: {statusTranslations[h.status as AssetStatus]}</li>
                    ))}
                </ul>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Mã QR</CardTitle>
                    <CardDescription>Quét để xem hoặc in nhãn.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-4">
                    <div className="bg-white p-2 rounded-md border">
                        <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `https://assetflow.app/assets/${asset.id}`
                        )}`}
                        alt={`Mã QR cho ${asset.id}`}
                        width={150}
                        height={150}
                        />
                    </div>
                    <p className="mt-2 text-xs font-semibold tracking-widest">{asset.id}</p>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Hành động</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Wrench className="mr-2 h-4 w-4" />Cập nhật trạng thái</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cập nhật trạng thái</DialogTitle>
                            </DialogHeader>
                            <Form {...statusUpdateForm}>
                                <form onSubmit={statusUpdateForm.handleSubmit(onStatusUpdate)} className="space-y-4">
                                <FormField
                                    control={statusUpdateForm.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Trạng thái mới</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="in-use">Đang sử dụng</SelectItem>
                                                    <SelectItem value="broken">Hỏng</SelectItem>
                                                    <SelectItem value="repairing">Đang sửa</SelectItem>
                                                    <SelectItem value="disposed">Đã thanh lý</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                <DialogFooter><Button type="submit">Lưu thay đổi</Button></DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Move className="mr-2 h-4 w-4" />Chuyển phòng</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Chuyển phòng</DialogTitle>
                            </DialogHeader>
                            <Form {...roomMoveForm}>
                                <form onSubmit={roomMoveForm.handleSubmit(onRoomMove)} className="space-y-4">
                                    <FormField
                                        control={roomMoveForm.control}
                                        name="roomId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phòng mới</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {allRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                    <DialogFooter><Button type="submit">Xác nhận</Button></DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild><Button size="sm"><Sparkles className="mr-2 h-4 w-4" />Gợi ý trạng thái AI</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Gợi ý trạng thái AI</DialogTitle>
                                <DialogDescription>Mô tả tình trạng hiện tại của tài sản để AI đưa ra gợi ý.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Textarea placeholder="Ví dụ: Màn hình bị nứt, không lên nguồn..." value={userInput} onChange={e => setUserInput(e.target.value)} />
                                {aiSuggestion && (
                                    <div className="rounded-md border bg-accent/50 p-3 text-sm">
                                        <p className="font-medium">Gợi ý của AI: <span className="font-bold">{aiSuggestion}</span></p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleGetAiSuggestion} disabled={aiLoading}>
                                    {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Lấy gợi ý
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
