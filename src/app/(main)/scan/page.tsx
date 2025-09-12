'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const QR_SCANNER_ELEMENT_ID = 'qr-scanner';

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      QR_SCANNER_ELEMENT_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [],
      },
      false // verbose
    );

    function onScanSuccess(decodedText: string, result: Html5QrcodeResult) {
      scanner.clear();
      setScanResult(decodedText);
      
      try {
        const url = new URL(decodedText);
        // Assuming the URL is for an asset, e.g., https://assetflow.app/assets/some-id
        if (url.pathname.startsWith('/assets/')) {
            router.push(url.pathname);
            toast({ title: 'Thành công', description: 'Đã tìm thấy tài sản.' });
        } else {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không hợp lệ.' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã QR không phải là một URL hợp lệ.' });
      }
    }

    function onScanFailure(error: Html5QrcodeError) {
      // This is called frequently, so we don't want to show a toast here.
    }
    
    const startScanner = async () => {
        try {
            await Html5QrcodeScanner.getCameras();
            setHasPermission(true);
            scanner.render(onScanSuccess, onScanFailure);
        } catch (err) {
            setHasPermission(false);
        }
    }

    startScanner();

    return () => {
      // cleanup function to stop the scanner
      if (scanner && scanner.getState() === 2) { // 2 is SCANNING state
        scanner.clear().catch(error => {
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
            <CardContent className="p-4">
                <div id={QR_SCANNER_ELEMENT_ID} className="w-full rounded-md overflow-hidden"/>
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

    