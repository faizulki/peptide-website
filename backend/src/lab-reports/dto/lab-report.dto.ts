import {
  IsString,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Empty form fields arrive as '' — store those as null rather than ''.
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export class CreateLabReportDto {
  @IsUUID()
  productId: string;

  @IsString()
  @MaxLength(1000)
  image: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(100)
  batchNumber?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @Matches(DATE_PATTERN, { message: 'testDate must be a date (YYYY-MM-DD)' })
  testDate?: string | null;
}

export class UpdateLabReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  image?: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsString()
  @MaxLength(100)
  batchNumber?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @Matches(DATE_PATTERN, { message: 'testDate must be a date (YYYY-MM-DD)' })
  testDate?: string | null;
}
