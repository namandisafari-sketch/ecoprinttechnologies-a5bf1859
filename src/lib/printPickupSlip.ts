import { format } from "date-fns";

export const printPickupSlip = (p: any) => {
  const win = window.open("", "_blank");
  if (!win) return;
  const fmt = (n: number) => `UGX ${Number(n || 0).toLocaleString()}`;
  const PURPOSES: Record<string, string> = {
    buying: "Buying outright",
    showing: "Showing to client",
    borrowing: "Borrowing / consignment",
  };
  const PAYMENTS: Record<string, string> = {
    unpaid: "Unpaid",
    cash: "Cash on spot",
    momo: "Mobile Money",
    on_return: "Pay on return",
  };

  win.document.write(`<!DOCTYPE html><html><head><title>Pickup Slip - ${p.pickup_number}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:18mm;width:210mm;color:#1a1a1a}
      .head{display:flex;justify-content:space-between;align-items:start;border-bottom:3px solid #1a1a1a;padding-bottom:12px;margin-bottom:18px}
      .brand h1{font-size:22px;letter-spacing:1px}
      .brand p{font-size:11px;color:#666}
      .doc-title{text-align:right}
      .doc-title h2{font-size:24px;color:#1a1a1a;text-transform:uppercase;letter-spacing:2px}
      .doc-title .num{font-family:'Courier New',monospace;font-size:14px;color:#666;margin-top:4px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
      .box{border:1px solid #ddd;padding:10px 12px;border-radius:4px}
      .box .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
      .box .val{font-size:13px;font-weight:600}
      table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}
      th{background:#1a1a1a;color:#fff;padding:8px;text-align:left;font-weight:600}
      td{padding:10px 8px;border-bottom:1px solid #eee}
      .total-row{border-top:2px solid #1a1a1a;font-weight:bold;font-size:14px}
      .terms{margin-top:18px;padding:12px;background:#fffbeb;border-left:4px solid #f59e0b;font-size:11px;line-height:1.6}
      .sigs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;margin-top:35px}
      .sig{border-top:1px solid #1a1a1a;padding-top:6px;text-align:center;font-size:11px}
      .sig .role{font-weight:600;color:#1a1a1a}
      .sig .name{color:#666;margin-top:2px;min-height:14px}
      .footer{position:absolute;bottom:10mm;left:18mm;right:18mm;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:6px}
      @page{size:A4;margin:0}
    </style></head><body>
    <div class="head">
      <div class="brand">
        <h1>ECO PRINT TECHNOLOGIES</h1>
        <p>Suncity Mall, Kampala • +256 700 000 000 • admin@ecotechnologies.app</p>
      </div>
      <div class="doc-title">
        <h2>Pickup Slip</h2>
        <div class="num">${p.pickup_number}</div>
        <div class="num">${format(new Date(), "PPP")}</div>
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="lbl">Broker</div>
        <div class="val">${p.brokers?.full_name || "—"}</div>
        <div style="font-size:11px;color:#666;margin-top:2px">${p.brokers?.phone || ""}</div>
      </div>
      <div class="box">
        <div class="lbl">Purpose of Pickup</div>
        <div class="val">${PURPOSES[p.purpose] || p.purpose}</div>
        <div style="font-size:11px;color:#666;margin-top:2px">Payment: ${PAYMENTS[p.payment_method] || p.payment_method}</div>
      </div>
      <div class="box">
        <div class="lbl">Expected Return</div>
        <div class="val">${p.expected_return_date ? format(new Date(p.expected_return_date), "PPP") : "Not specified"}</div>
      </div>
      <div class="box">
        <div class="lbl">Released By</div>
        <div class="val">${p.released_by || "Storekeeper"}</div>
        <div style="font-size:11px;color:#666;margin-top:2px">${p.released_at ? format(new Date(p.released_at), "PPp") : ""}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Item</th><th>SKU/Serial</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Value</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${p.product_name}</strong></td>
          <td>${p.product_sku || "—"}</td>
          <td style="text-align:right">${p.quantity}</td>
          <td style="text-align:right">${fmt(p.unit_price)}</td>
          <td style="text-align:right">${fmt(p.total_value)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" style="text-align:right">TOTAL VALUE:</td>
          <td style="text-align:right">${fmt(p.total_value)}</td>
        </tr>
        ${p.amount_paid ? `<tr><td colspan="4" style="text-align:right">Amount Paid:</td><td style="text-align:right;color:#16a34a">${fmt(p.amount_paid)}</td></tr>
        <tr><td colspan="4" style="text-align:right;font-weight:bold">Balance:</td><td style="text-align:right;font-weight:bold;color:#dc2626">${fmt(Number(p.total_value) - Number(p.amount_paid))}</td></tr>` : ""}
      </tbody>
    </table>

    ${p.notes ? `<div class="box" style="margin-top:14px"><div class="lbl">Notes</div><div style="font-size:12px">${p.notes}</div></div>` : ""}

    <div class="terms">
      <strong>Terms of Pickup:</strong><br/>
      1. The broker acknowledges receipt of the item(s) listed above in good condition.<br/>
      2. The item(s) remain the property of Eco Print Technologies until fully paid for.<br/>
      3. Any damage, loss, or theft while in the broker's custody is the broker's full responsibility.<br/>
      4. Items not returned by the expected date without prior notice will be billed in full.<br/>
      5. The broker agrees to the purpose of pickup stated above and may not use the item otherwise.
    </div>

    <div class="sigs">
      <div class="sig"><div class="role">Broker Signature</div><div class="name">${p.brokers?.full_name || ""}</div></div>
      <div class="sig"><div class="role">Released By</div><div class="name">${p.released_by || ""}</div></div>
      <div class="sig"><div class="role">Approved By</div><div class="name">Admin</div></div>
    </div>

    <div class="footer">Eco Print Technologies • Powered by Kabejja Systems (www.kabejjasystems.store)</div>
    </body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 400);
};
