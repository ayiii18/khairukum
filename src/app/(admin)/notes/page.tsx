import { getNotes } from '@/lib/queries/notes';
import NotesClient from './NotesClient';

export default async function NotesPage() {
  const notes = await getNotes();
  return <NotesClient initialNotes={notes} />;
}
