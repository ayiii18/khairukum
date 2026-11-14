import { getEvaluations } from '@/lib/queries/evaluations';
import { getStudentsForAttendance } from '@/lib/queries/attendance';
import { getHalaqatOptions } from '@/lib/queries/students';
import EvaluationsClient from './EvaluationsClient';

export default async function EvaluationsPage() {
  const [records, activeStudents, halaqat] = await Promise.all([
    getEvaluations(),
    getStudentsForAttendance(),
    getHalaqatOptions()
  ]);

  return <EvaluationsClient initialRecords={records} activeStudents={activeStudents} halaqat={halaqat} />;
}
