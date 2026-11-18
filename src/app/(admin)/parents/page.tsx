import { getParents } from '@/lib/queries/parents';
import ParentsClient from './ParentsClient';

export default async function ParentsPage() {
  const parents = await getParents();
  return <ParentsClient initialParents={parents} />;
}
