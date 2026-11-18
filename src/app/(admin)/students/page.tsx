import { getStudents, getHalaqatOptions, getMosqueOptions } from '@/lib/queries/students';
import StudentsClient from './StudentsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{
    search?: string;
    filter?: string;
    mosque?: string;
    halaqa?: string;
  }>;
}

export default async function StudentsListPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const resolved = {
    search: params.search?.trim() || '',
    filter: params.filter?.trim() || '',
    mosque: params.mosque?.trim() || '',
    halaqa: params.halaqa?.trim() || '',
  };

  const [students, halaqat, mosques] = await Promise.all([
    getStudents({
      search: resolved.search,
      mosque: resolved.mosque,
      halaqa: resolved.halaqa,
    }),
    getHalaqatOptions(),
    getMosqueOptions(),
  ]);

  return (
    <StudentsClient
      initialStudents={students}
      halaqat={halaqat}
      mosques={mosques}
      initialSearch={resolved.search}
      initialFilter={resolved.filter}
      initialMosque={resolved.mosque}
      initialHalaqa={resolved.halaqa}
    />
  );
}
