import { getMosqueOptions, getHalaqatOptions } from '@/lib/queries/students';
import AddStudentFormClient from './AddStudentFormClient';

export default async function AddStudentPage() {
  const [mosques, halaqat] = await Promise.all([
    getMosqueOptions(),
    getHalaqatOptions()
  ]);

  return <AddStudentFormClient mosques={mosques} halaqat={halaqat} />;
}
