import { getEvaluations } from '@/lib/queries/evaluations';
import { getHalaqatOptions } from '@/lib/queries/students';
import EvaluationsClient from './EvaluationsClient';

export default async function EvaluationsPage() {
  const [records, halaqat] = await Promise.all([
    getEvaluations(),
    getHalaqatOptions(),
  ]);

  return <EvaluationsClient initialRecords={records} halaqat={halaqat} />;
}
