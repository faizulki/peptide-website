import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEmail,
  Matches,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Letters, digits, dash and underscore — safe to drop straight into a URL.
const CODE_PATTERN = /^[A-Za-z0-9_-]{2,32}$/;
const CODE_MESSAGE =
  'code must be 2-32 characters: letters, numbers, dash or underscore';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class CreateAffiliateDto {
  @IsString()
  @Transform(trim)
  @MaxLength(100)
  name: string;

  @IsString()
  @Transform(trim)
  @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  code: string;

  @IsEmail()
  @IsOptional()
  @Transform(emptyToUndefined)
  email?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPercent?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercent?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAffiliateDto {
  @IsString()
  @Transform(trim)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @Transform(trim)
  @Matches(CODE_PATTERN, { message: CODE_MESSAGE })
  @IsOptional()
  code?: string;

  @IsEmail()
  @IsOptional()
  @Transform(emptyToUndefined)
  email?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPercent?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercent?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePayoutDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
