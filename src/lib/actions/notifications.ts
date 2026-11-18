'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/access';

export async function markNotificationRead(id: string) {
  await requireAdmin();
  await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1`, [id]);
  revalidatePath('/notifications');
}

export async function markAllNotificationsRead() {
  const session = await requireAdmin();
  await query(
    `UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE AND (user_id = $1 OR $2 = 'ADMIN')`,
    [session.userId, session.role]
  );
  revalidatePath('/notifications');
}

export async function deleteNotification(id: string) {
  await requireAdmin();
  await query(`DELETE FROM notifications WHERE id = $1`, [id]);
  revalidatePath('/notifications');
}
