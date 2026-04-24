import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { APP_CONFIG } from '../config';
import type { User, UserRole } from '../types/User';
import { NotificationService } from './NotificationService';

const LOCAL_STORAGE_KEY = 'prismboard_users';

export class UserService {
  static async getAllUsers(): Promise<User[]> {
    if (APP_CONFIG.storage === 'database') {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => doc.data() as User);
    } else {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
  }

  static listenToAuthChanges(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      const userId = firebaseUser.uid;
      const email = firebaseUser.email || '';
      
      // Pobieramy displayName z Google, a jeśli go nie ma - początek adresu e-mail
      const fullName = firebaseUser.displayName || email.split('@')[0] || 'Użytkownik';
      const [firstName, ...lastNameParts] = fullName.trim().split(' ');

      let appUser = await this.getUserById(userId);

      if (!appUser) {
        const isSuperAdmin = email === APP_CONFIG.superAdminEmail;
        appUser = {
          id: userId,
          email,
          firstName: firstName || 'Użytkownik',
          // POPRAWKA: Jeśli brakuje drugiego członu nazwy, nazwisko pozostaje puste
          lastName: lastNameParts.length > 0 ? lastNameParts.join(' ') : '',
          role: isSuperAdmin ? 'admin' : 'guest',
          isBlocked: false
        };

        await this.saveUser(appUser);

        if (!isSuperAdmin) {
          const allUsers = await this.getAllUsers();
          allUsers.filter(u => u.role === 'admin').forEach(admin => {
            NotificationService.create(admin.id, 'Nowe konto', `Użytkownik ${email} zarejestrował się w systemie.`, 'high');
          });
        }
      }

      callback(appUser);
    });
  }

  static async loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Błąd logowania:", error);
    }
  }

  static async logout() {
    await signOut(auth);
  }

  static async updateUser(id: string, updates: Partial<User>) {
    if (APP_CONFIG.storage === 'database') {
      await updateDoc(doc(db, 'users', id), updates);
    } else {
      const users = await this.getAllUsers();
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
      }
    }
  }

  private static async getUserById(id: string): Promise<User | null> {
    if (APP_CONFIG.storage === 'database') {
      const docRef = await getDoc(doc(db, 'users', id));
      return docRef.exists() ? (docRef.data() as User) : null;
    } else {
      const users = await this.getAllUsers();
      return users.find(u => u.id === id) || null;
    }
  }

  private static async saveUser(user: User) {
    if (APP_CONFIG.storage === 'database') {
      await setDoc(doc(db, 'users', user.id), user);
    } else {
      const users = await this.getAllUsers();
      users.push(user);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
    }
  }
}