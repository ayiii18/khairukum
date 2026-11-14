import { getRevisionRecords } from '@/lib/queries/revision';
import { getStudentsForAttendance } from '@/lib/queries/attendance';
import { getHalaqatOptions } from '@/lib/queries/students';
import RevisionClient from './RevisionClient';

export default async function RevisionPage() {
  const [records, activeStudents, halaqat] = await Promise.all([
    getRevisionRecords(),
    getStudentsForAttendance(),
    getHalaqatOptions()
  ]);

  return <RevisionClient initialRecords={records} activeStudents={activeStudents} halaqat={halaqat} />;
}
