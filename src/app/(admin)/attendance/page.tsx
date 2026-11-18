import { getAttendance } from '@/lib/queries/attendance';
import { getMosqueOptions, getHalaqatOptions } from '@/lib/queries/students';
import AttendanceClient from './AttendanceClient';

export default async function AttendancePage() {
  const [history, mosques, halaqat] = await Promise.all([
    getAttendance(),
    getMosqueOptions(),
    getHalaqatOptions(),
  ]);

  return <AttendanceClient historicalRecords={history} mosques={mosques} halaqat={halaqat} />;
}
