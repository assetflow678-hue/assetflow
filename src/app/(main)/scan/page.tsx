'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle, SwitchCamera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const QR_SCANNER_ELEMENT_ID = 'qr-scanner';

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const onScanSuccess = useCallback((decodedText: string) => {
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
  }, [router, toast]);

  const onScanFailure = (error: any) => {
    // This callback is called frequently, so we don't show a toast here.
  };

  useEffect(() => {
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(QR_SCANNER_ELEMENT_ID, {
            formatsToSupport: [0], // 0 = QR_CODE
            verbose: false,
        });
    }

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer the back camera as default
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          setSelectedCameraId(backCamera?.id || devices[0].id);
          setHasPermission(true);
        } else {
          setHasPermission(false);
          setScanError("Không tìm thấy thiết bị camera nào.");
        }
      })
      .catch(err => {
        setHasPermission(false);
        setScanError("Không thể truy cập camera. Vui lòng cấp quyền trong cài đặt trình duyệt.");
        console.error("Lỗi khi yêu cầu quyền camera:", err);
      });
      
    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
          // This can sometimes fail if the component unmounts too quickly.
          // It's usually safe to ignore.
        });
      }
    };
  }, []);

  useEffect(() => {
    const startScanner = async () => {
      if (selectedCameraId && hasPermission) {
        const scanner = scannerRef.current;
        if (scanner) {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }

            await scanner.start(
              selectedCameraId,
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
          } catch (err) {
            setScanError("Không thể khởi động camera. Hãy thử lại.");
            console.error("Lỗi khi khởi động scanner:", err);
          }
        }
      }
    };

    startScanner();
  }, [selectedCameraId, hasPermission, onScanSuccess]);


  const handleSwitchCamera = () => {
    if (cameras.length > 1 && selectedCameraId) {
      const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedCameraId(cameras[nextIndex].id);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Camera className="h-6 w-6" />
            <h1 className="text-xl font-bold font-headline">Quét mã QR tài sản</h1>
        </div>
        {cameras.length > 1 && (
            <Button variant="outline" size="icon" onClick={handleSwitchCamera}>
                <SwitchCamera className="h-5 w-5" />
                <span className="sr-only">Đổi camera</span>
            </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0 relative">
          <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden aspect-square bg-muted" />
          {hasPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="text-center">
                    <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Đang yêu cầu quyền truy cập camera...</p>
                </div>
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
