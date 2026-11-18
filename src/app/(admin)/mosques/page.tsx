import { getMosques } from '@/lib/queries/mosques';
import MosquesClient from './MosquesClient';

export default async function MosquesPage() {
  const mosques = await getMosques();
  return <MosquesClient initialMosques={mosques} />;
}
