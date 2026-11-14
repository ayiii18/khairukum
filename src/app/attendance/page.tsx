import { getAttendance, getStudentsForAttendance } from '@/lib/queries/attendance';
import { getMosqueOptions, getHalaqatOptions } from '@/lib/queries/students';
import AttendanceClient from './AttendanceClient';

export default async function AttendancePage() {
  const [history, activeStudents, mosques, halaqat] = await Promise.all([
    getAttendance(),
    getStudentsForAttendance(),
    getMosqueOptions(),
    getHalaqatOptions()
  ]);

  return <AttendanceClient historicalRecords={history} activeStudents={activeStudents} mosques={mosques} halaqat={halaqat} />;
}
