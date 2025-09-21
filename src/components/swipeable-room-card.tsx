'use client';

import type { Room } from '@/lib/types';
import { getAssetsByRoomId } from '@/lib/firestore-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from './ui/button';
import { User, Warehouse, Trash2, FilePenLine } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type TouchEvent, useEffect } from 'react';
import { cn } from '@/lib/utils';

const SWIPE_THRESHOLD_OPEN = 80; // px to swipe right to reveal actions
const SWIPE_THRESHOLD_CLOSE = -50; // px to swipe left to close actions
const ACTIONS_WIDTH = 160; // Total width of the actions container

interface SwipeableRoomCardProps {
  room: Room;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableRoomCard({ room, onEdit, onDelete }: SwipeableRoomCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const startDragX = useRef(0); // The value of dragX when the drag started

  const [assetCount, setAssetCount] = useState(0);
  
  useEffect(() => {
    // Since getAssetsByRoomId is now async, we fetch it inside useEffect
    getAssetsByRoomId(room.id).then(assets => {
      setAssetCount(assets.length);
    });
  }, [room.id]);


  const handleDragStart = (e: TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartX.current = e.targetTouches[0].clientX;
    startDragX.current = dragX; // Store the current translation
  };

  const handleDragMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentX = e.targetTouches[0].clientX;
    const deltaX = currentX - dragStartX.current;
    const newDragX = startDragX.current + deltaX;

    // Only allow dragging right, not past the actions width, and not past the original position
    if (newDragX >= -5 && newDragX <= ACTIONS_WIDTH + 20) {
      setDragX(newDragX);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Snap open or closed
    if (dragX > SWIPE_THRESHOLD_OPEN) {
      setDragX(ACTIONS_WIDTH); // Snap open
    } else if (dragX < startDragX.current + SWIPE_THRESHOLD_CLOSE) {
       setDragX(0); // Snap closed if swiped left enough
    }
    else {
      setDragX(0); // Snap back to closed position
    }
    dragStartX.current = 0;
  };
  
  return (
    <div className="relative w-full overflow-hidden rounded-lg">
        {/* Action Buttons */}
        <div className="absolute top-0 left-0 flex h-full items-center">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="ghost" className="h-full w-[80px] rounded-none bg-destructive/20 text-destructive hover:bg-destructive/30 flex-col gap-1.5">
                        <Trash2 className="h-5 w-5" />
                        <span className="text-xs font-semibold">Xóa</span>
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn phòng
                             "{room.name}" và tất cả tài sản liên quan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete}>Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" className="h-full w-[80px] rounded-none bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 flex-col gap-1.5" onClick={onEdit}>
                <FilePenLine className="h-5 w-5" />
                <span className="text-xs font-semibold">Sửa</span>
            </Button>
        </div>
      
        {/* Card Content */}
        <div
            ref={cardRef}
            className="transition-transform duration-200 ease-in-out w-full bg-card"
            style={{ transform: `translateX(${dragX}px)` }}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >
            <Link href={`/rooms/${room.id}`} draggable="false" className={cn(dragX !== 0 && "pointer-events-none")}>
                <Card className={cn(
                    "h-full transition-colors rounded-lg",
                     dragX === 0 ? "hover:bg-accent" : ""
                )}>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                        <Warehouse className="h-5 w-5 text-primary" />
                        {room.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-1 text-xs">
                        <User className="h-4 w-4" />
                        {room.manager}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-xs text-muted-foreground">
                        Số lượng tài sản:{' '}
                        <span className="font-bold text-foreground">
                            {assetCount}
                        </span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    </div>
  );
}