interface A4ReceiptProps {
  order: any;
}

const A4Receipt = ({ order }: A4ReceiptProps) => {
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="receipt p-8 font-sans text-black" style={{ minHeight: "297mm" }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ECO PRINT TECHNOLOGIES</h1>
          <p className="text-gray-600">Laptops & Tech Services</p>
          <p className="text-sm text-gray-500 mt-2">
            Tel: +256 705 154 828<br />
            Email: info@ecoprint.ug<br />
            Suncity Mall, Kampala
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-700">RECEIPT</h2>
          <p className="text-lg font-mono mt-2">{order.order_number}</p>
          <p className="text-sm text-gray-500 mt-1">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* Customer & Payment Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Customer Details</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-medium">{order.customer_name || "Walk-in Customer"}</p>
            {order.customer_phone && order.customer_phone !== "N/A" && (
              <p className="text-sm text-gray-600">Phone: {order.customer_phone}</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-700 mb-2">Payment Details</h3>
          <div className="bg-gray-50 p-4 rounded">
            <p><span className="text-gray-600">Method:</span> {order.payment_method?.replace(/_/g, " ").toUpperCase()}</p>
            <p><span className="text-gray-600">Status:</span> <span className="text-green-600 font-medium">PAID</span></p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-4 font-bold text-gray-700">#</th>
              <th className="text-left py-3 px-4 font-bold text-gray-700">Description</th>
              <th className="text-center py-3 px-4 font-bold text-gray-700">Qty</th>
              <th className="text-right py-3 px-4 font-bold text-gray-700">Unit Price</th>
              <th className="text-right py-3 px-4 font-bold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                <td className="py-3 px-4">{item.product.name}</td>
                <td className="py-3 px-4 text-center">{item.quantity}</td>
                <td className="py-3 px-4 text-right">{formatPrice(item.product.price)}</td>
                <td className="py-3 px-4 text-right font-medium">
                  {formatPrice(item.product.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between py-2 text-green-600">
              <span>Discount ({order.discount}%):</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-800 font-bold text-xl">
            <span>Total:</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-auto">
        <div className="text-center text-gray-600">
          <p className="font-medium mb-2">Thank you for your purchase!</p>
          <p className="text-sm">
            For any inquiries regarding this receipt, please contact us at info@ecoprint.ug
          </p>
          <p className="text-xs mt-4 text-gray-400">
            This is a computer-generated receipt and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default A4Receipt;
