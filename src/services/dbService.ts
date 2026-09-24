import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { initializeFirebaseServices } from '../firebase/config';
import {
  initialSchoolInfo,
  initialPrincipalMessage,
  initialTeachers,
  initialStudents,
  initialRoutines,
  initialExams,
  initialResults,
  initialNotices,
  initialGallery
} from '../data/initialData';
import {
  Teacher,
  Student,
  RoutinePeriod,
  Examination,
  StudentResult,
  Notice,
  SchoolInfo,
  PrincipalMessage,
  GalleryItem
} from '../types';

type Listener = () => void;

class DatabaseService {
  private listeners: Set<Listener> = new Set();

  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`mghs_${key}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
    }
    // Initialize with default
    this.setStorageItem(key, defaultValue);
    return defaultValue;
  }

  private setStorageItem<T>(key: string, value: T) {
    try {
      localStorage.setItem(`mghs_${key}`, JSON.stringify(value));
      this.notifyListeners();
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in db subscriber:', err);
      }
    });
  }

  // --- SCHOOL INFO ---
  async getSchoolInfo(): Promise<SchoolInfo> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'settings'));
        const docFound = snap.docs.find((d) => d.id === 'schoolInfo');
        if (docFound) {
          const remote = docFound.data() as SchoolInfo;
          this.setStorageItem('school_info', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore fetch schoolInfo fallback to local:', e);
      }
    }
    return this.getStorageItem<SchoolInfo>('school_info', initialSchoolInfo);
  }

  async updateSchoolInfo(info: SchoolInfo): Promise<void> {
    this.setStorageItem('school_info', info);
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'schoolInfo'), info);
      } catch (e) {
        console.warn('Firestore update schoolInfo failed:', e);
      }
    }
  }

  // --- PRINCIPAL MESSAGE ---
  async getPrincipalMessage(): Promise<PrincipalMessage> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'settings'));
        const docFound = snap.docs.find((d) => d.id === 'principalMessage');
        if (docFound) {
          const remote = docFound.data() as PrincipalMessage;
          this.setStorageItem('principal_message', remote);
          return remote;
        }
      } catch (e) {
        console.warn('Firestore fetch principalMessage fallback to local:', e);
      }
    }
    return this.getStorageItem<PrincipalMessage>('principal_message', initialPrincipalMessage);
  }

  async updatePrincipalMessage(msg: PrincipalMessage): Promise<void> {
    this.setStorageItem('principal_message', msg);
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'settings', 'principalMessage'), msg);
      } catch (e) {
        console.warn('Firestore update principalMessage failed:', e);
      }
    }
  }

  // --- TEACHERS ---
  async getTeachers(): Promise<Teacher[]> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'teachers'));
        if (!snap.empty) {
          const list: Teacher[] = snap.docs.map((d) => ({ ...(d.data() as Teacher), id: d.id }));
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          this.setStorageItem('teachers', list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore fetch teachers fallback:', e);
      }
    }
    const local = this.getStorageItem<Teacher[]>('teachers', initialTeachers);
    return [...local].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async addTeacher(teacher: Omit<Teacher, 'id'>): Promise<Teacher> {
    const id = `t-${Date.now()}`;
    const newTeacher: Teacher = { ...teacher, id };
    const list = await this.getTeachers();
    const updated = [...list, newTeacher];
    this.setStorageItem('teachers', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'teachers', id), newTeacher);
      } catch (e) {
        console.warn('Firestore addTeacher failed:', e);
      }
    }
    return newTeacher;
  }

  async updateTeacher(id: string, updates: Partial<Teacher>): Promise<void> {
    const list = await this.getTeachers();
    const updated = list.map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.setStorageItem('teachers', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await updateDoc(doc(db, 'teachers', id), updates);
      } catch (e) {
        console.warn('Firestore updateTeacher failed:', e);
      }
    }
  }

  async deleteTeacher(id: string): Promise<void> {
    const list = await this.getTeachers();
    const updated = list.filter((t) => t.id !== id);
    this.setStorageItem('teachers', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await deleteDoc(doc(db, 'teachers', id));
      } catch (e) {
        console.warn('Firestore deleteTeacher failed:', e);
      }
    }
  }

  // --- STUDENTS ---
  async getStudents(): Promise<Student[]> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'students'));
        if (!snap.empty) {
          const list: Student[] = snap.docs.map((d) => ({ ...(d.data() as Student), id: d.id }));
          list.sort((a, b) => a.roll - b.roll);
          this.setStorageItem('students', list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore fetch students fallback:', e);
      }
    }
    return this.getStorageItem<Student[]>('students', initialStudents);
  }

  async addStudent(student: Omit<Student, 'id'>): Promise<Student> {
    const id = `s-${Date.now()}`;
    const newStudent: Student = { ...student, id };
    const list = await this.getStudents();
    const updated = [...list, newStudent];
    this.setStorageItem('students', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'students', id), newStudent);
      } catch (e) {
        console.warn('Firestore addStudent failed:', e);
      }
    }
    return newStudent;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<void> {
    const list = await this.getStudents();
    const updated = list.map((s) => (s.id === id ? { ...s, ...updates } : s));
    this.setStorageItem('students', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await updateDoc(doc(db, 'students', id), updates);
      } catch (e) {
        console.warn('Firestore updateStudent failed:', e);
      }
    }
  }

  async deleteStudent(id: string): Promise<void> {
    const list = await this.getStudents();
    const updated = list.filter((s) => s.id !== id);
    this.setStorageItem('students', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (e) {
        console.warn('Firestore deleteStudent failed:', e);
      }
    }
  }

  // --- ROUTINES ---
  async getRoutines(): Promise<RoutinePeriod[]> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'routines'));
        if (!snap.empty) {
          const list: RoutinePeriod[] = snap.docs.map((d) => ({ ...(d.data() as RoutinePeriod), id: d.id }));
          this.setStorageItem('routines', list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore fetch routines fallback:', e);
      }
    }
    return this.getStorageItem<RoutinePeriod[]>('routines', initialRoutines);
  }

  async addRoutine(routine: Omit<RoutinePeriod, 'id'>): Promise<RoutinePeriod> {
    const id = `r-${Date.now()}`;
    const newRoutine: RoutinePeriod = { ...routine, id };
    const list = await this.getRoutines();
    const updated = [...list, newRoutine];
    this.setStorageItem('routines', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'routines', id), newRoutine);
      } catch (e) {
        console.warn('Firestore addRoutine failed:', e);
      }
    }
    return newRoutine;
  }

  async updateRoutine(id: string, updates: Partial<RoutinePeriod>): Promise<void> {
    const list = await this.getRoutines();
    const updated = list.map((r) => (r.id === id ? { ...r, ...updates } : r));
    this.setStorageItem('routines', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await updateDoc(doc(db, 'routines', id), updates);
      } catch (e) {
        console.warn('Firestore updateRoutine failed:', e);
      }
    }
  }

  async deleteRoutine(id: string): Promise<void> {
    const list = await this.getRoutines();
    const updated = list.filter((r) => r.id !== id);
    this.setStorageItem('routines', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await deleteDoc(doc(db, 'routines', id));
      } catch (e) {
        console.warn('Firestore deleteRoutine failed:', e);
      }
    }
  }

  // --- EXAMS ---
  async getExams(): Promise<Examination[]> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'exams'));
        if (!snap.empty) {
          const list: Examination[] = snap.docs.map((d) => ({ ...(d.data() as Examination), id: d.id }));
          this.setStorageItem('exams', list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore fetch exams fallback:', e);
      }
    }
    return this.getStorageItem<Examination[]>('exams', initialExams);
  }

  async addExam(exam: Omit<Examination, 'id'>): Promise<Examination> {
    const id = `exam-${Date.now()}`;
    const newExam: Examination = { ...exam, id };
    const list = await this.getExams();
    const updated = [...list, newExam];
    this.setStorageItem('exams', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'exams', id), newExam);
      } catch (e) {
        console.warn('Firestore addExam failed:', e);
      }
    }
    return newExam;
  }

  async deleteExam(id: string): Promise<void> {
    const list = await this.getExams();
    const updated = list.filter((e) => e.id !== id);
    this.setStorageItem('exams', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await deleteDoc(doc(db, 'exams', id));
      } catch (e) {
        console.warn('Firestore deleteExam failed:', e);
      }
    }
  }

  // --- RESULTS ---
  async getResults(onlyPublished: boolean = false): Promise<StudentResult[]> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'results'));
        if (!snap.empty) {
          let list: StudentResult[] = snap.docs.map((d) => ({ ...(d.data() as StudentResult), id: d.id }));
          this.setStorageItem('results', list);
          if (onlyPublished) {
            list = list.filter((r) => r.isPublished);
          }
          return list;
        }
      } catch (e) {
        console.warn('Firestore fetch results fallback:', e);
      }
    }
    const all = this.getStorageItem<StudentResult[]>('results', initialResults);
    return onlyPublished ? all.filter((r) => r.isPublished) : all;
  }

  async addResult(result: Omit<StudentResult, 'id'>): Promise<StudentResult> {
    const id = `res-${Date.now()}`;
    const newResult: StudentResult = { ...result, id };
    const list = await this.getResults(false);
    const updated = [...list, newResult];
    this.setStorageItem('results', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'results', id), newResult);
      } catch (e) {
        console.warn('Firestore addResult failed:', e);
      }
    }
    return newResult;
  }

  async updateResult(id: string, updates: Partial<StudentResult>): Promise<void> {
    const list = await this.getResults(false);
    const updated = list.map((r) => (r.id === id ? { ...r, ...updates } : r));
    this.setStorageItem('results', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await updateDoc(doc(db, 'results', id), updates);
      } catch (e) {
        console.warn('Firestore updateResult failed:', e);
      }
    }
  }

  async togglePublishResult(id: string, isPublished: boolean): Promise<void> {
    await this.updateResult(id, {
      isPublished,
      publishedAt: isPublished ? new Date().toISOString().split('T')[0] : undefined
    });
  }

  async deleteResult(id: string): Promise<void> {
    const list = await this.getResults(false);
    const updated = list.filter((r) => r.id !== id);
    this.setStorageItem('results', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await deleteDoc(doc(db, 'results', id));
      } catch (e) {
        console.warn('Firestore deleteResult failed:', e);
      }
    }
  }

  // --- NOTICES ---
  async getNotices(): Promise<Notice[]> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'notices'));
        if (!snap.empty) {
          const list: Notice[] = snap.docs.map((d) => ({ ...(d.data() as Notice), id: d.id }));
          this.setStorageItem('notices', list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore fetch notices fallback:', e);
      }
    }
    return this.getStorageItem<Notice[]>('notices', initialNotices);
  }

  async addNotice(notice: Omit<Notice, 'id'>): Promise<Notice> {
    const id = `not-${Date.now()}`;
    const newNotice: Notice = { ...notice, id };
    const list = await this.getNotices();
    const updated = [newNotice, ...list];
    this.setStorageItem('notices', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'notices', id), newNotice);
      } catch (e) {
        console.warn('Firestore addNotice failed:', e);
      }
    }
    return newNotice;
  }

  async deleteNotice(id: string): Promise<void> {
    const list = await this.getNotices();
    const updated = list.filter((n) => n.id !== id);
    this.setStorageItem('notices', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (e) {
        console.warn('Firestore deleteNotice failed:', e);
      }
    }
  }

  // --- GALLERY ---
  async getGallery(): Promise<GalleryItem[]> {
    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'gallery'));
        if (!snap.empty) {
          const list: GalleryItem[] = snap.docs.map((d) => ({ ...(d.data() as GalleryItem), id: d.id }));
          this.setStorageItem('gallery', list);
          return list;
        }
      } catch (e) {
        console.warn('Firestore fetch gallery fallback:', e);
      }
    }
    return this.getStorageItem<GalleryItem[]>('gallery', initialGallery);
  }

  async addGalleryItem(item: Omit<GalleryItem, 'id'>): Promise<GalleryItem> {
    const id = `gal-${Date.now()}`;
    const newItem: GalleryItem = { ...item, id };
    const list = await this.getGallery();
    const updated = [newItem, ...list];
    this.setStorageItem('gallery', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await setDoc(doc(db, 'gallery', id), newItem);
      } catch (e) {
        console.warn('Firestore addGalleryItem failed:', e);
      }
    }
    return newItem;
  }

  async deleteGalleryItem(id: string): Promise<void> {
    const list = await this.getGallery();
    const updated = list.filter((g) => g.id !== id);
    this.setStorageItem('gallery', updated);

    const { db } = initializeFirebaseServices();
    if (db) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (e) {
        console.warn('Firestore deleteGalleryItem failed:', e);
      }
    }
  }

  // Reset database back to default seed data if admin wants a clean reset
  async resetToDefaults(): Promise<void> {
    this.setStorageItem('school_info', initialSchoolInfo);
    this.setStorageItem('principal_message', initialPrincipalMessage);
    this.setStorageItem('teachers', initialTeachers);
    this.setStorageItem('students', initialStudents);
    this.setStorageItem('routines', initialRoutines);
    this.setStorageItem('exams', initialExams);
    this.setStorageItem('results', initialResults);
    this.setStorageItem('notices', initialNotices);
    this.setStorageItem('gallery', initialGallery);
  }

  // --- CONVENIENCE SAVE HELPERS ---
  get isUsingFirestore(): boolean {
    const { db } = initializeFirebaseServices();
    return !!db;
  }

  async saveSchoolInfo(info: SchoolInfo): Promise<void> {
    await this.updateSchoolInfo(info);
  }

  async savePrincipalMessage(msg: PrincipalMessage): Promise<void> {
    await this.updatePrincipalMessage(msg);
  }

  async saveTeacher(teacher: Teacher): Promise<void> {
    const list = await this.getTeachers();
    if (list.some((t) => t.id === teacher.id)) {
      await this.updateTeacher(teacher.id, teacher);
    } else {
      await this.addTeacher(teacher);
    }
  }

  async saveStudent(student: Student): Promise<void> {
    const list = await this.getStudents();
    if (list.some((s) => s.id === student.id)) {
      await this.updateStudent(student.id, student);
    } else {
      await this.addStudent(student);
    }
  }

  async saveRoutine(routine: RoutinePeriod): Promise<void> {
    const list = await this.getRoutines();
    if (list.some((r) => r.id === routine.id)) {
      await this.updateRoutine(routine.id, routine);
    } else {
      await this.addRoutine(routine);
    }
  }

  async saveExam(exam: Examination): Promise<void> {
    const list = await this.getExams();
    const existing = list.find((e) => e.id === exam.id);
    if (existing) {
      const updated = list.map((e) => (e.id === exam.id ? exam : e));
      this.setStorageItem('exams', updated);
      const { db } = initializeFirebaseServices();
      if (db) {
        try {
          await setDoc(doc(db, 'exams', exam.id), exam);
        } catch (e) {
          console.warn('Firestore updateExam failed:', e);
        }
      }
    } else {
      await this.addExam(exam);
    }
  }

  async saveResult(result: StudentResult): Promise<void> {
    const list = await this.getResults(false);
    if (list.some((r) => r.id === result.id)) {
      await this.updateResult(result.id, result);
    } else {
      await this.addResult(result);
    }
  }

  async saveNotice(notice: Notice): Promise<void> {
    const list = await this.getNotices();
    const existing = list.find((n) => n.id === notice.id);
    if (existing) {
      const updated = list.map((n) => (n.id === notice.id ? notice : n));
      this.setStorageItem('notices', updated);
      const { db } = initializeFirebaseServices();
      if (db) {
        try {
          await setDoc(doc(db, 'notices', notice.id), notice);
        } catch (e) {
          console.warn('Firestore updateNotice failed:', e);
        }
      }
    } else {
      await this.addNotice(notice);
    }
  }

  async saveGalleryItem(item: GalleryItem): Promise<void> {
    const list = await this.getGallery();
    const existing = list.find((g) => g.id === item.id);
    if (existing) {
      const updated = list.map((g) => (g.id === item.id ? item : g));
      this.setStorageItem('gallery', updated);
      const { db } = initializeFirebaseServices();
      if (db) {
        try {
          await setDoc(doc(db, 'gallery', item.id), item);
        } catch (e) {
          console.warn('Firestore updateGallery failed:', e);
        }
      }
    } else {
      await this.addGalleryItem(item);
    }
  }
}

export const dbService = new DatabaseService();
