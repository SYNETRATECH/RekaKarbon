import { Injectable } from '@nestjs/common';
import { User } from '../types/auth';

@Injectable()
export class UsersService {
  private readonly users: User[] = [];

  findOneByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.email === email));
  }

  findById(id: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.id === id));
  }

  create(user: User): Promise<User> {
    this.users.push(user);
    return Promise.resolve(user);
  }
}
