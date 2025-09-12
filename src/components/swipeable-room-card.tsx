'use client';

import type { Room } from '@/lib/types';
import { getAssetsByRoomId } from '@/lib/mock-data';
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
import { useRef, useState, type TouchEvent } from 'react';
import { cn } from '@/lib/utils';

const SWIPE_THRESHOLD = -80; // px to swipe left to reveal actions
const ACTIONS_WIDTH = 150; // Total width of the actions container

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

  const handleDragStart = (e: TouchEvent<HTMLDivElement>) => {
    // Don't drag if swipe is already active
    if (dragX < 0) return;
    
    setIsDragging(true);
    dragStartX.current = e.targetTouches[0].clientX;
  };

  const handleDragMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentX = e.targetTouches[0].clientX;
    const deltaX = currentX - dragStartX.current;
    
    // Only allow dragging left, and not past the actions width
    if (deltaX < 10 && deltaX > -ACTIONS_WIDTH - 20) {
      setDragX(deltaX);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Snap open or closed
    if (dragX < SWIPE_THRESHOLD) {
      setDragX(-ACTIONS_WIDTH); // Snap open
    } else {
      setDragX(0); // Snap closed
    }
    dragStartX.current = 0;
  };

  // Function to close the actions when clicking away or on the card
  const closeActions = () => {
    setDragX(0);
  };
  
  return (
    <div className="relative w-full overflow-hidden">
        {/* Action Buttons */}
        <div className="absolute top-0 right-0 flex h-full items-center">
            <Button variant="ghost" className="h-full rounded-none bg-blue-500/20 text-blue-700 hover:bg-blue-500/30" onClick={onEdit}>
                <FilePenLine className="h-5 w-5" />
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="ghost" className="h-full rounded-none bg-destructive/20 text-destructive hover:bg-destructive/30">
                        <Trash2 className="h-5 w-5" />
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
        </div>
      
        {/* Card Content */}
        <div
            ref={cardRef}
            className="transition-transform duration-200 ease-in-out w-full"
            style={{ transform: `translateX(${dragX}px)` }}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
        >
            <Link href={`/rooms/${room.id}`} draggable="false" onClickCapture={(e) => {
                // Prevent navigation if card was swiped
                if (dragX !== 0) {
                    e.preventDefault();
                    closeActions();
                }
            }}>
                <Card className={cn(
                    "h-full transition-colors",
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
                            {getAssetsByRoomId(room.id).length}
                        </span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    </div>
  );
}
