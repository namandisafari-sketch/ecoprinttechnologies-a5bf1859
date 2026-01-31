import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, X } from "lucide-react";
import ThermalReceipt from "./ThermalReceipt";
import A4Receipt from "./A4Receipt";

interface ReceiptModalProps {
  order: any;
  onClose: () => void;
}

const ReceiptModal = ({ order, onClose }: ReceiptModalProps) => {
  const [receiptType, setReceiptType] = useState<"thermal" | "a4">("thermal");
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; }
        ${receiptType === "thermal" ? `
          body { width: 80mm; }
          .receipt { padding: 10px; }
        ` : `
          body { width: 210mm; }
          .receipt { padding: 20px; }
        `}
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.order_number}</title>
          ${styles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 20px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `], { type: "text/html" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt - {order.order_number}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Type Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={receiptType === "thermal" ? "default" : "outline"}
            size="sm"
            onClick={() => setReceiptType("thermal")}
          >
            Thermal (80mm)
          </Button>
          <Button
            variant={receiptType === "a4" ? "default" : "outline"}
            size="sm"
            onClick={() => setReceiptType("a4")}
          >
            A4 Invoice
          </Button>
        </div>

        {/* Receipt Preview */}
        <div className="flex-1 overflow-auto bg-muted/50 rounded-lg p-4">
          <div
            ref={receiptRef}
            className={`bg-white mx-auto shadow-lg ${
              receiptType === "thermal" ? "w-[80mm]" : "w-full max-w-[210mm]"
            }`}
          >
            {receiptType === "thermal" ? (
              <ThermalReceipt order={order} />
            ) : (
              <A4Receipt order={order} />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="secondary" onClick={onClose}>
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;
