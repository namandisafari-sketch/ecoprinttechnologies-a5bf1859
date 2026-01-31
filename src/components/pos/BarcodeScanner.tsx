import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const BarcodeScanner = ({ onScan, isOpen, onClose }: BarcodeScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {
          // Ignore errors during scanning
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(err.message || "Failed to start camera. Please ensure camera permissions are granted.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode or QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            id="barcode-scanner-container"
            ref={containerRef}
            className="w-full min-h-[300px] bg-muted rounded-lg overflow-hidden"
          />
          {error && (
            <div className="text-destructive text-sm text-center p-4 bg-destructive/10 rounded-lg">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={startScanner}
              >
                Try Again
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Point your camera at a product barcode or QR code to scan
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
