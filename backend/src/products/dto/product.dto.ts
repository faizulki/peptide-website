import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  shortDescription: string;

  @IsString()
  @IsOptional()
  nameSv?: string;

  @IsString()
  @IsOptional()
  descriptionSv?: string;

  @IsString()
  @IsOptional()
  shortDescriptionSv?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  image: string;

  @IsString()
  category: string;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsNumber()
  @IsOptional()
  stockLevel?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  freeShipping?: boolean;

  @IsArray()
  @IsOptional()
  specifications?: string[];

  @IsString()
  @IsOptional()
  usage?: string;

  @IsString()
  @IsOptional()
  storage?: string;

  @IsArray()
  @IsOptional()
  warnings?: string[];

  @IsArray()
  @IsOptional()
  specificationsSv?: string[];

  @IsString()
  @IsOptional()
  usageSv?: string;

  @IsString()
  @IsOptional()
  storageSv?: string;

  @IsArray()
  @IsOptional()
  warningsSv?: string[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  nameSv?: string;

  @IsString()
  @IsOptional()
  descriptionSv?: string;

  @IsString()
  @IsOptional()
  shortDescriptionSv?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsNumber()
  @IsOptional()
  stockLevel?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  freeShipping?: boolean;

  @IsArray()
  @IsOptional()
  specifications?: string[];

  @IsString()
  @IsOptional()
  usage?: string;

  @IsString()
  @IsOptional()
  storage?: string;

  @IsArray()
  @IsOptional()
  warnings?: string[];

  @IsArray()
  @IsOptional()
  specificationsSv?: string[];

  @IsString()
  @IsOptional()
  usageSv?: string;

  @IsString()
  @IsOptional()
  storageSv?: string;

  @IsArray()
  @IsOptional()
  warningsSv?: string[];
}
