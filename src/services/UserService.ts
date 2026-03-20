import type { User } from '../types/User';

const MOCK_USERS: User[] = [
  { id: 'user-1', firstName: 'Jan', lastName: 'Kowalski', role: 'admin' }, // Zalogowany
  { id: 'user-2', firstName: 'Anna', lastName: 'Nowak', role: 'developer' },
  { id: 'user-3', firstName: 'Piotr', lastName: 'Wiśniewski', role: 'devops' }
];

export class UserService {
  static getLoggedInUser(): User {
    return MOCK_USERS[0];
  }

  static getAllUsers(): User[] {
    return MOCK_USERS;
  }
}