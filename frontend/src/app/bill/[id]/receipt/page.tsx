import ReceiptPageClient from "./ReceiptPageClient";

export function generateStaticParams() {
  return [{ id: "example" }];
}

export const dynamicParams = false;

export default function ReceiptPage({ params }: { params: { id: string } }) {
  return <ReceiptPageClient id={params.id} />;
}
