import { ProgramsDrill, type Search } from "@/components/drill";

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  return <ProgramsDrill role="admin" search={await searchParams} />;
}
