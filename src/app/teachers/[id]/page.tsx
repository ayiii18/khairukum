import React from 'react';
import { getTeacherById, getTeacherHalaqat } from '@/lib/queries/teachers';
import { getHalaqatOptions } from '@/lib/queries/students';
import { notFound } from 'next/navigation';
import TeacherProfileClient from './TeacherProfileClient';

export const dynamic = 'force-dynamic';

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const teacherId = resolvedParams.id;

  const [teacher, assignments, allHalaqat] = await Promise.all([
    getTeacherById(teacherId),
    getTeacherHalaqat(teacherId),
    getHalaqatOptions(),
  ]);

  if (!teacher) {
    notFound();
  }

  return (
    <TeacherProfileClient
      teacher={teacher}
      assignments={assignments}
      allHalaqat={allHalaqat}
    />
  );
}
