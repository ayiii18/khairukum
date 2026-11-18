import { getMemorizationRecords } from '@/lib/queries/memorization';
import { getHalaqatOptions } from '@/lib/queries/students';
import MemorizationClient from './MemorizationClient';

export default async function MemorizationPage() {
  const [records, halaqat] = await Promise.all([
    getMemorizationRecords(),
    getHalaqatOptions(),
  ]);

  return <MemorizationClient initialRecords={records} halaqat={halaqat} />;
}
