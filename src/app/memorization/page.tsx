import { getMemorizationRecords } from '@/lib/queries/memorization';
import { getStudentsForAttendance } from '@/lib/queries/attendance';
import { getHalaqatOptions } from '@/lib/queries/students';
import MemorizationClient from './MemorizationClient';

export default async function MemorizationPage() {
  const [records, activeStudents, halaqat] = await Promise.all([
    getMemorizationRecords(),
    getStudentsForAttendance(),
    getHalaqatOptions()
  ]);

  return <MemorizationClient initialRecords={records} activeStudents={activeStudents} halaqat={halaqat} />;
}
