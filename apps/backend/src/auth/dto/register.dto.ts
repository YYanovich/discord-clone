import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(3, { message: 'Username min 3 characters' })
  @MaxLength(32, { message: 'Username max 32 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username: only letters, numbers, _ and -',
  })
  username!: string;

  @IsString()
  @MinLength(8, { message: 'Password min 8 characters' })
  @MaxLength(128, { message: 'Password max 128 characters' })
  @Matches(/^(?=.*\p{Ll})(?=.*\p{Lu})(?=.*\d).+$/u, {
    message: 'Password must have uppercase, lowercase and number',
  })
  password!: string;
}
