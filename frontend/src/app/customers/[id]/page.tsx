import CustomerDetailPageClient from "./CustomerPageClient";

export function generateStaticParams() {
  return [{ id: "example" }];
}

export const dynamicParams = false;

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return <CustomerDetailPageClient id={params.id} />;
}

