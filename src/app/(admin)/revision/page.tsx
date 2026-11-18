import { getRevisionRecords } from '@/lib/queries/revision';
import { getHalaqatOptions } from '@/lib/queries/students';
import RevisionClient from './RevisionClient';

export default async function RevisionPage() {
  const [records, halaqat] = await Promise.all([
    getRevisionRecords(),
    getHalaqatOptions(),
  ]);

  return <RevisionClient initialRecords={records} halaqat={halaqat} />;
}
