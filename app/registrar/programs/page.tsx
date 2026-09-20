import { ProgramsDrill, type Search } from "@/components/drill";

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  return <ProgramsDrill role="registrar" search={await searchParams} />;
}
