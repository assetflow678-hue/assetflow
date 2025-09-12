'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
        if (url.pathname.startsWith('/assets/')) {
            router.push(url.pathname);
            toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        } else {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không hợp lệ.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không phải là một URL hợp lệ.' });
      }
    };

    const onScanFailure = (error: Html5QrcodeError) => {
      // Ignore scan failures.
    };
    
    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        setHasPermission(true);

        if (devices && devices.length) {
            html5QrCode = new Html5Qrcode(QR_SCANNER_ELEMENT_ID);
            const cameraId = devices.find(d => d.label.toLowerCase().includes('back'))?.id || devices[0].id;
            
            html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                onScanSuccess,
                onScanFailure
            ).catch(err => {
                console.error("Error starting QR scanner", err);
                setHasPermission(false);
            });
        }
      } catch (err) {
        console.error("Camera permission denied or no cameras found.", err);
        setHasPermission(false);
      }
    }

    // Request permission first, then start scanner
    if (hasPermission === null) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
                startScanner();
            })
            .catch(err => {
                console.error("Camera permission denied.", err);
                setHasPermission(false);
            });
    }


    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
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
                <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden aspect-square"/>
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
