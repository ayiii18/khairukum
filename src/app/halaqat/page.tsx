import { getHalaqat } from '@/lib/queries/halaqat';
import { getMosqueOptions } from '@/lib/queries/students';
import HalaqatClient from './HalaqatClient';

export default async function HalaqatPage() {
  const [halaqat, mosques] = await Promise.all([
    getHalaqat(),
    getMosqueOptions()
  ]);

  return <HalaqatClient initialHalaqat={halaqat} mosques={mosques} />;
}
