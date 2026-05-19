// FILE : backend/src/admin/dto/create-user.dto.ts

export class CreateUserDto {

  email!: string;

  password!: string;

  displayName!: string;

  accountType?: 'USER' | 'BUSINESS' | 'ADMIN';

  accountStatus?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BLOCKED';

}