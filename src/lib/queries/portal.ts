import { query, queryOne } from '@/lib/db';

export interface ParentChildData {
  student_id: string;
  enrollment_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string | null;
  phone: string | null;
  halaqa_id: string;
  halaqa_name: string;
  mosque_name: string;
  teacher_name: string | null;
  teacher_phone: string | null;
  relationship: string | null;
  attendance_stats: {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    attendance_rate: number;
  };
  recent_attendance: {
    id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    note: string | null;
  }[];
  recent_memorization: {
    id: string;
    surah: string;
    from_ayah: number;
    to_ayah: number;
    evaluation: number | null;
    note: string | null;
    recorded_at: string;
  }[];
  recent_revision: {
    id: string;
    surah: string;
    from_ayah: number;
    to_ayah: number;
    evaluation: number | null;
    note: string | null;
    recorded_at: string;
  }[];
  notes: {
    id: string;
    category: string;
    content: string;
    teacher_name: string;
    created_at: string;
  }[];
}

export interface ParentPortalPayload {
  parent: {
    id: string;
    full_name: string;
    phone: string;
  };
  children: ParentChildData[];
}

export async function getParentPortalData(identifier: string): Promise<ParentPortalPayload | null> {
  try {
    // 1. Resolve parent by user_id, parent_id, or phone
    const parent = await queryOne<{ id: string; user_id: string; full_name: string; phone: string }>(
      `SELECT p.id, p.user_id, p.full_name, u.phone
       FROM parents p
       JOIN users u ON u.id = p.user_id
       WHERE p.id::text = $1 OR p.user_id::text = $1 OR u.phone = $1
       LIMIT 1`,
      [identifier]
    );

    if (!parent) {
      return null;
    }

    // 2. Fetch children associated with this parent
    const childrenRows = await query<{
      student_id: string;
      full_name: string;
      gender: string;
      date_of_birth: string | null;
      phone: string | null;
      relationship: string | null;
      enrollment_id: string;
      halaqa_id: string;
      halaqa_name: string;
      mosque_name: string;
      teacher_name: string | null;
      teacher_phone: string | null;
    }>(
      `SELECT 
         s.id AS student_id,
         s.full_name,
         s.gender,
         s.date_of_birth::text,
         s.phone,
         ps.relationship,
         se.id AS enrollment_id,
         h.id AS halaqa_id,
         h.name AS halaqa_name,
         m.name AS mosque_name,
         t.full_name AS teacher_name,
         t.phone AS teacher_phone
       FROM parent_students ps
       JOIN students s ON s.id = ps.student_id
       LEFT JOIN student_enrollments se ON se.student_id = s.id AND se.status = 'ACTIVE'
       LEFT JOIN halaqat h ON h.id = se.halaqa_id
       LEFT JOIN mosques m ON m.id = h.mosque_id
       LEFT JOIN teacher_halaqas th ON th.halaqa_id = h.id AND th.is_primary = TRUE
       LEFT JOIN teachers t ON t.id = th.teacher_id
       WHERE ps.parent_id = $1
       ORDER BY s.full_name ASC`,
      [parent.id]
    );

    const children: ParentChildData[] = [];

    for (const child of childrenRows) {
      // Attendance stats
      const stats = await queryOne<{
        total_days: number;
        present_days: number;
        absent_days: number;
        late_days: number;
      }>(
        `SELECT 
           COUNT(*)::int AS total_days,
           COUNT(CASE WHEN status = 'PRESENT' THEN 1 END)::int AS present_days,
           COUNT(CASE WHEN status = 'ABSENT' THEN 1 END)::int AS absent_days,
           COUNT(CASE WHEN status = 'LATE' THEN 1 END)::int AS late_days
         FROM attendance
         WHERE student_enrollment_id = $1`,
        [child.enrollment_id || '00000000-0000-0000-0000-000000000000']
      );

      const totalDays = stats?.total_days || 0;
      const presentDays = stats?.present_days || 0;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

      // Recent attendance list
      const attendanceList = await query<{
        id: string;
        date: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
        note: string | null;
      }>(
        `SELECT id, attendance_date::text AS date, status, note
         FROM attendance
         WHERE student_enrollment_id = $1
         ORDER BY attendance_date DESC
         LIMIT 20`,
        [child.enrollment_id || '00000000-0000-0000-0000-000000000000']
      );

      // Recent memorization
      const memorizationList = await query<{
        id: string;
        surah: string;
        from_ayah: number;
        to_ayah: number;
        evaluation: number | null;
        note: string | null;
        recorded_at: string;
      }>(
        `SELECT id, surah, from_ayah, to_ayah, evaluation, note, recorded_at::text
         FROM memorization
         WHERE student_enrollment_id = $1
         ORDER BY recorded_at DESC
         LIMIT 15`,
        [child.enrollment_id || '00000000-0000-0000-0000-000000000000']
      );

      // Recent revision
      const revisionList = await query<{
        id: string;
        surah: string;
        from_ayah: number;
        to_ayah: number;
        evaluation: number | null;
        note: string | null;
        recorded_at: string;
      }>(
        `SELECT id, surah, from_ayah, to_ayah, evaluation, note, recorded_at::text
         FROM revision
         WHERE student_enrollment_id = $1
         ORDER BY recorded_at DESC
         LIMIT 15`,
        [child.enrollment_id || '00000000-0000-0000-0000-000000000000']
      );

      // Teacher notes for this student
      const notesList = await query<{
        id: string;
        category: string;
        content: string;
        teacher_name: string;
        created_at: string;
      }>(
        `SELECT n.id, n.category, n.content, t.full_name AS teacher_name, n.created_at::text
         FROM notes n
         LEFT JOIN teachers t ON t.id = n.teacher_id
         WHERE n.student_id = $1
         ORDER BY n.created_at DESC
         LIMIT 10`,
        [child.student_id]
      );

      children.push({
        student_id: child.student_id,
        enrollment_id: child.enrollment_id,
        full_name: child.full_name,
        gender: child.gender,
        date_of_birth: child.date_of_birth,
        phone: child.phone,
        relationship: child.relationship,
        halaqa_id: child.halaqa_id,
        halaqa_name: child.halaqa_name || 'غير مسكن بحلقة',
        mosque_name: child.mosque_name || 'غير محدد',
        teacher_name: child.teacher_name,
        teacher_phone: child.teacher_phone,
        attendance_stats: {
          total_days: totalDays,
          present_days: presentDays,
          absent_days: stats?.absent_days || 0,
          late_days: stats?.late_days || 0,
          attendance_rate: attendanceRate,
        },
        recent_attendance: attendanceList,
        recent_memorization: memorizationList,
        recent_revision: revisionList,
        notes: notesList,
      });
    }

    return {
      parent: {
        id: parent.id,
        full_name: parent.full_name,
        phone: parent.phone,
      },
      children,
    };
  } catch (error) {
    console.error('Error fetching parent portal data:', error);
    return null;
  }
}

export interface TeacherPortalHalaqa {
  id: string;
  name: string;
  mosque_name: string;
  is_primary: boolean;
  student_count: number;
  students: {
    enrollment_id: string;
    student_id: string;
    full_name: string;
    gender: string;
    phone: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    today_attendance: {
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
      note: string | null;
    };
    last_memorization: {
      surah: string;
      from_ayah: number;
      to_ayah: number;
      evaluation: number | null;
      recorded_at: string;
    } | null;
  }[];
}

export interface TeacherPortalPayload {
  teacher: {
    id: string;
    full_name: string;
    phone: string;
  };
  halaqat: TeacherPortalHalaqa[];
}

export async function getTeacherPortalData(identifier: string): Promise<TeacherPortalPayload | null> {
  try {
    // 1. Resolve teacher by user_id, teacher_id, or phone
    const teacher = await queryOne<{ id: string; user_id: string; full_name: string; phone: string }>(
      `SELECT t.id, t.user_id, t.full_name, u.phone
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE t.id::text = $1 OR t.user_id::text = $1 OR u.phone = $1
       LIMIT 1`,
      [identifier]
    );

    if (!teacher) {
      return null;
    }

    // 2. Fetch halaqat assigned to this teacher
    const halaqatRows = await query<{
      id: string;
      name: string;
      mosque_name: string;
      is_primary: boolean;
    }>(
      `SELECT 
         h.id,
         h.name,
         m.name AS mosque_name,
         th.is_primary
       FROM teacher_halaqas th
       JOIN halaqat h ON h.id = th.halaqa_id
       JOIN mosques m ON m.id = h.mosque_id
       WHERE th.teacher_id = $1
       ORDER BY th.is_primary DESC, h.name ASC`,
      [teacher.id]
    );

    const todayDate = new Date().toISOString().slice(0, 10);
    const halaqat: TeacherPortalHalaqa[] = [];

    for (const h of halaqatRows) {
      // Fetch students in this halaqa
      const studentsRows = await query<{
        enrollment_id: string;
        student_id: string;
        full_name: string;
        gender: string;
        phone: string | null;
        parent_name: string | null;
        parent_phone: string | null;
      }>(
        `SELECT 
           se.id AS enrollment_id,
           s.id AS student_id,
           s.full_name,
           s.gender,
           s.phone,
           p.full_name AS parent_name,
           pu.phone AS parent_phone
         FROM student_enrollments se
         JOIN students s ON s.id = se.student_id
         LEFT JOIN parent_students ps ON ps.student_id = s.id AND ps.is_primary = TRUE
         LEFT JOIN parents p ON p.id = ps.parent_id
         LEFT JOIN users pu ON pu.id = p.user_id
         WHERE se.halaqa_id = $1 AND se.status = 'ACTIVE'
         ORDER BY s.full_name ASC`,
        [h.id]
      );

      const studentList = [];

      for (const st of studentsRows) {
        // Today's attendance
        const todayAtt = await queryOne<{
          status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
          note: string | null;
        }>(
          `SELECT status, note FROM attendance 
           WHERE student_enrollment_id = $1 AND attendance_date = $2`,
          [st.enrollment_id, todayDate]
        );

        // Last memorization
        const lastMemo = await queryOne<{
          surah: string;
          from_ayah: number;
          to_ayah: number;
          evaluation: number | null;
          recorded_at: string;
        }>(
          `SELECT surah, from_ayah, to_ayah, evaluation, recorded_at::text
           FROM memorization
           WHERE student_enrollment_id = $1
           ORDER BY recorded_at DESC
           LIMIT 1`,
          [st.enrollment_id]
        );

        studentList.push({
          enrollment_id: st.enrollment_id,
          student_id: st.student_id,
          full_name: st.full_name,
          gender: st.gender,
          phone: st.phone,
          parent_name: st.parent_name,
          parent_phone: st.parent_phone,
          today_attendance: {
            status: todayAtt?.status || null,
            note: todayAtt?.note || null,
          },
          last_memorization: lastMemo || null,
        });
      }

      halaqat.push({
        id: h.id,
        name: h.name,
        mosque_name: h.mosque_name,
        is_primary: h.is_primary,
        student_count: studentList.length,
        students: studentList,
      });
    }

    return {
      teacher: {
        id: teacher.id,
        full_name: teacher.full_name,
        phone: teacher.phone,
      },
      halaqat,
    };
  } catch (error) {
    console.error('Error fetching teacher portal data:', error);
    return null;
  }
}
