import { InfrastructureDrill, type Search } from "@/components/drill";

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  return <InfrastructureDrill role="vc" search={await searchParams} />;
}
