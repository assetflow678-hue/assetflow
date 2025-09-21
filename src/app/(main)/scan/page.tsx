'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const QR_SCANNER_ELEMENT_ID = 'qr-scanner';

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | undefined;

    const onScanSuccess = (decodedText: string, result: Html5QrcodeResult) => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop QR scanner", err));
      }
      
      try {
        const url = new URL(decodedText);
        // We only care about the path, so we use the path from the scanned URL
        const path = url.pathname;

        if (path.startsWith('/assets/')) {
            router.push(path);
            toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        } else {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không hợp lệ.' });
        }
      } catch (error) {
        // This is a fallback for non-URL QR codes that might just contain an asset ID
        // A simple check for a pattern like RXXX-YYYY-ZZZZ
        const assetId = decodedText;
        if (/^R\d{3}-\w+-\d{4}$/.test(assetId)) {
             router.push(`/assets/${encodeURIComponent(assetId)}`);
             toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        } else {
            toast({ variant: 'destructive', title: 'Lỗi', description: `Mã QR không hợp lệ: ${decodedText}` });
        }
      }
    };

    const onScanFailure = (error: Html5QrcodeError) => {
      // Ignore scan failures as they happen continuously.
    };
    
    const startScanner = async () => {
      // Ensure the element is in the DOM
      const scannerElement = document.getElementById(QR_SCANNER_ELEMENT_ID);
      if (!scannerElement) {
        console.error(`Element with id ${QR_SCANNER_ELEMENT_ID} not found.`);
        return;
      }

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
            setHasPermission(true);
            html5QrCode = new Html5Qrcode(QR_SCANNER_ELEMENT_ID, {
              formatsToSupport: [0], // 0 is QR_CODE
              verbose: false
            });
            const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;
            
            html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                      const qrboxSize = Math.max(200, Math.floor(minEdge * 0.7));
                      return { width: qrboxSize, height: qrboxSize };
                    },
                    aspectRatio: 1.0,
                },
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                console.error("Error starting QR scanner", err);
                toast({ variant: "destructive", title: "Lỗi Camera", description: "Không thể khởi động camera để quét."})
                setHasPermission(false);
            });
        } else {
             setHasPermission(false);
        }
      } catch (err) {
        console.error("Camera permission denied or no cameras found.", err);
        setHasPermission(false);
      }
    }

    const requestPermissionAndStart = async () => {
        try {
            // This is a common way to prompt for camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop using the camera immediately
            startScanner();
        } catch (err) {
            setHasPermission(false);
            console.error("Error getting camera permissions:", err);
        }
    };
    
    // Only attempt to start scanner if permission state is not yet determined
    if (hasPermission === null) {
      requestPermissionAndStart();
    }


    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          // console.log("QR Code scanning stopped successfully.");
        }).catch(error => {
          // Don't log error if scanner element is gone, which is expected on navigation
          if (document.getElementById(QR_SCANNER_ELEMENT_ID)) {
             console.error("Failed to clear html5-qrcode-scanner.", error);
          }
        });
      }
    };
  }, [router, toast, hasPermission]);

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Camera className="h-6 w-6" />
            <h1 className="text-xl font-bold font-headline">Quét mã QR tài sản</h1>
        </div>

        <Card>
            <CardContent className="p-0">
                 {hasPermission === null ? (
                    <Skeleton className="w-full aspect-square animate-pulse" />
                ) : (
                    <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden aspect-square bg-muted"/>
                )}
            </CardContent>
        </Card>

        {hasPermission === false && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Không có quyền truy cập Camera</AlertTitle>
                <AlertDescription>
                    Vui lòng cấp quyền sử dụng camera trong cài đặt trình duyệt để quét mã QR.
                </AlertDescription>
            </Alert>
        )}
    </div>
  );
}
