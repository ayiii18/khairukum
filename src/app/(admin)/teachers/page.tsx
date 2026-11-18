import { getTeachers } from '@/lib/queries/teachers';
import { getMosques } from '@/lib/queries/mosques';
import { getHalaqatOptions } from '@/lib/queries/students';
import TeachersClient from './TeachersClient';

export const dynamic = 'force-dynamic';

export default async function TeachersPage() {
  const [teachers, mosques, halaqat] = await Promise.all([
    getTeachers(),
    getMosques(),
    getHalaqatOptions(),
  ]);
  return <TeachersClient initialTeachers={teachers} mosques={mosques} halaqat={halaqat} />;
}
