import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminButton, Badge, Card, PageHeader, PanelSkeleton } from "@/features/admin/components/ui";
import { formatDateTime, orderStatusMeta, paymentStatusMeta } from "@/features/admin/labels";
import { DeliveryFeeControl, NotesControl, PaymentControl, StatusControl } from "@/features/admin/orders/order-controls";
import { getOrderDetail } from "@/features/admin/orders/queries";
import { requireAdmin } from "@/features/auth/dal";
import { WhatsAppIcon } from "@/components/shop/icons";
import { formatLKR } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Order" };

export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();
  const s = orderStatusMeta(order.status);
  const p = paymentStatusMeta(order.paymentStatus);
  const firstName = order.customerName.split(" ")[0];
  const contactUrl = buildWhatsAppUrl(`Hi ${firstName}, this is ORACK about your order ${order.reference}.`, order.customerPhone);

  return (
    <>
      <PageHeader
        title={order.reference}
        back={{ href: "/admin/orders", label: "Orders" }}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <>
            <Badge tone={s.tone}>{s.label}</Badge>
            <Badge tone={p.tone}>{p.label}</Badge>
            <a href={contactUrl} target="_blank" rel="noopener noreferrer" className={adminButton({ size: "sm" })}>
              <WhatsAppIcon /> Message customer
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card title="Items">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-line text-xs text-smoke">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-semibold">Product</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Variant</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">Unit</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">Qty</th>
                    <th scope="col" className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td className="py-3 pr-3">
                        <div className="font-semibold">{i.productName}</div>
                        {i.sku && <div className="font-mono text-xs text-smoke">{i.sku}</div>}
                      </td>
                      <td className="py-3 pr-3">
                        {i.colorName} / {i.size}
                      </td>
                      <td className="py-3 pr-3 text-right">{formatLKR(i.unitPrice)}</td>
                      <td className="py-3 pr-3 text-right">{i.quantity}</td>
                      <td className="py-3 text-right font-semibold">{formatLKR(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col items-end gap-3 border-t border-line pt-4">
              <div className="flex w-64 justify-between text-sm">
                <span className="text-smoke">Subtotal</span>
                <span>{formatLKR(order.subtotal)}</span>
              </div>
              <DeliveryFeeControl orderId={order.id} deliveryFee={order.deliveryFee} disabled={order.status === "CANCELLED"} />
              <div className="flex w-64 justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatLKR(order.total)}</span>
              </div>
            </div>
          </Card>

          <Card title="Customer">
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="eyebrow text-smoke">Name</dt>
                <dd className="mt-1 font-semibold">{order.customerName}</dd>
              </div>
              <div>
                <dt className="eyebrow text-smoke">WhatsApp</dt>
                <dd className="mt-1">
                  <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                    {order.customerPhone}
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="eyebrow text-smoke">Delivery address</dt>
                <dd className="mt-1 whitespace-pre-line">{order.deliveryAddress}</dd>
              </div>
              {order.customerNote && (
                <div className="sm:col-span-2">
                  <dt className="eyebrow text-smoke">Customer note</dt>
                  <dd className="mt-1 whitespace-pre-line">{order.customerNote}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="History">
            <ol className="flex flex-col gap-4">
              {order.statusHistory.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {h.toStatus && <Badge tone={orderStatusMeta(h.toStatus).tone}>{orderStatusMeta(h.toStatus).label}</Badge>}
                      {h.toPaymentStatus && <Badge tone={paymentStatusMeta(h.toPaymentStatus).tone}>{paymentStatusMeta(h.toPaymentStatus).label}</Badge>}
                      <span className="text-smoke">
                        {formatDateTime(h.createdAt)} · {h.changedBy?.name ?? "Customer"}
                      </span>
                    </div>
                    {h.note && <p className="mt-1 text-graphite">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <StatusControl orderId={order.id} status={order.status} />
          <PaymentControl orderId={order.id} paymentStatus={order.paymentStatus} />
          <NotesControl orderId={order.id} notes={order.adminNotes} />
        </div>
      </div>
    </>
  );
}
