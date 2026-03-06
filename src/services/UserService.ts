import type { User } from '../types/User';

export class UserService {
  static getLoggedInUser(): User {
    return {
      id: 'user-123',
      firstName: 'Jan',
      lastName: 'Kowalski'
    };
  }
}