import { FacultyDrill, type Search } from "@/components/drill";

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  return <FacultyDrill role="vc" search={await searchParams} />;
}
