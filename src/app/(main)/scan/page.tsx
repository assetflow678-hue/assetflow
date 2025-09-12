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
        if (url.protocol === 'https:' && url.hostname.endsWith('assetflow.app') && url.pathname.startsWith('/assets/')) {
            router.push(url.pathname);
            toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        } else if (url.pathname.startsWith('/assets/')) {
            // Handle development URLs or relative paths if needed
             router.push(url.pathname);
             toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        } else {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không hợp lệ.' });
        }
      } catch (error) {
        // Fallback for non-URL QR codes that might just contain an asset ID
        if (decodedText.includes('-')) {
             router.push(`/assets/${decodedText}`);
             toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        } else {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không phải là một URL hợp lệ.' });
        }
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
                      // Set a minimum size and a percentage of the viewfinder
                      const qrboxSize = Math.max(200, Math.floor(minEdge * 0.7));
                      return {
                        width: qrboxSize,
                        height: qrboxSize,
                      };
                    },
                    aspectRatio: 1.0,
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

    // Check for permissions first, then start the scanner.
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setHasPermission(true);
          startScanner();
        } else {
          setHasPermission(false);
        }
      })
      .catch(err => {
        setHasPermission(false);
        console.error("Error getting cameras:", err);
      });


    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
      }
    };
  }, [router, toast]);

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Camera className="h-6 w-6" />
            <h1 className="text-xl font-bold font-headline">Quét mã QR tài sản</h1>
        </div>

        <Card>
            <CardContent className="p-0">
                <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden aspect-square bg-muted"/>
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
