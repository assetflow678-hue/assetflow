'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Function to handle successful scan
  const onScanSuccess = (decodedText: string) => {
    // Stop scanner on success to prevent multiple scans
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(err => {
        console.error("Failed to stop QR scanner after success", err);
      });
    }

    try {
      // Attempt to parse the decoded text as a URL
      const url = new URL(decodedText);
      const path = url.pathname;

      if (path.startsWith('/assets/')) {
        toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        router.push(path);
      } else {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không hợp lệ.' });
      }
    } catch (e) {
      // If it's not a valid URL, it might be a relative path or just an ID
       if (decodedText.startsWith('/assets/')) {
         toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
         router.push(decodedText);
       } else if (decodedText.length > 5 && decodedText.length < 50) { // Simple validation for asset ID
         toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
         router.push(`/assets/${encodeURIComponent(decodedText)}`);
       } else {
         toast({ variant: 'destructive', title: 'Lỗi', description: `Mã QR không hợp lệ: ${decodedText}` });
       }
    }
  };

  const onScanFailure = (error: any) => {
    // This callback is called frequently, so we don't show a toast here.
    // We can log it for debugging if needed, but it's often just "QR code not found".
  };

  useEffect(() => {
    // Create a scanner instance if it doesn't exist
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(QR_SCANNER_ELEMENT_ID, {
            formatsToSupport: [0], // 0 = QR_CODE
            verbose: false,
        });
    }

    const scanner = scannerRef.current;

    // Request camera permission and start scanner
    const requestPermissionAndStart = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setHasPermission(true);
          
          // Prefer the back camera
          const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;
          
          // Start scanning
          await scanner.start(
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
          );
        } else {
            setScanError("Không tìm thấy thiết bị camera nào.");
            setHasPermission(false);
        }
      } catch (err: any) {
        console.error("Lỗi khi yêu cầu quyền camera:", err);
        setScanError("Không thể truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt.");
        setHasPermission(false);
      }
    };
    
    requestPermissionAndStart();

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(err => {
          // This can sometimes fail if the component unmounts too quickly.
          // It's usually safe to ignore.
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Camera className="h-6 w-6" />
        <h1 className="text-xl font-bold font-headline">Quét mã QR tài sản</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden aspect-square bg-muted" />
          {hasPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
                <Skeleton className="w-full h-full" />
                <p className="absolute text-muted-foreground">Đang yêu cầu quyền truy cập camera...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {hasPermission === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Không có quyền truy cập Camera</AlertTitle>
          <AlertDescription>
            {scanError || "Vui lòng cấp quyền sử dụng camera trong cài đặt trình duyệt để quét mã QR."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
