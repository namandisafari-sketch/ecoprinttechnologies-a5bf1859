interface ThermalReceiptProps {
  order: any;
}

const ThermalReceipt = ({ order }: ThermalReceiptProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="receipt p-4 font-mono text-xs text-black" style={{ width: "80mm" }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">SIR WANDA</h1>
        <p className="text-[10px]">Phone Care Online Shop</p>
        <p className="text-[10px]">Tel: +256 XXX XXX XXX</p>
        <div className="border-t border-dashed border-black my-2" />
      </div>

      {/* Order Info */}
      <div className="mb-3">
        <p><strong>Receipt #:</strong> {order.order_number}</p>
        <p><strong>Date:</strong> {formatDate(order.created_at)}</p>
        {order.customer_name && order.customer_name !== "Walk-in Customer" && (
          <p><strong>Customer:</strong> {order.customer_name}</p>
        )}
        <p><strong>Payment:</strong> {order.payment_method?.replace(/_/g, " ").toUpperCase()}</p>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Items */}
      <div className="mb-3">
        <div className="flex justify-between font-bold mb-1">
          <span>Item</span>
          <span>Amount</span>
        </div>
        {order.items.map((item: any, index: number) => (
          <div key={index} className="mb-1">
            <p className="truncate">{item.product.name}</p>
            <div className="flex justify-between text-[10px] pl-2">
              <span>{item.quantity} × {formatPrice(item.product.price)}</span>
              <span>{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Totals */}
      <div className="mb-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount ({order.discount}%):</span>
            <span>-{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>TOTAL:</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2" />

      {/* Footer */}
      <div className="text-center text-[10px]">
        <p className="font-bold mb-1">PAID - THANK YOU!</p>
        <p>Keep this receipt for your records</p>
        <p>Visit us again at Sir Wanda</p>
        <p className="mt-2">www.sirwanda.com</p>
      </div>
    </div>
  );
};

export default ThermalReceipt;
