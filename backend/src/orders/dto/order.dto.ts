import { IsString, IsEmail, IsObject, ValidateNested, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
}

export class CheckoutDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsString()
  @IsOptional()
  guestId?: string;

  // 'card' routes through PayGate's onramp selector (Klarna, card, etc.);
  // 'crypto' skips straight to PayGate's own wallet-to-wallet checkout for
  // customers who already hold BTC/EVM crypto. Defaults to 'card'.
  @IsString()
  @IsOptional()
  paymentType?: 'card' | 'crypto';

  // ISO currency code (e.g. 'EUR', 'SEK'). Determines both the currency the
  // customer pays in and, on the card path, which local providers PayGate's
  // selector surfaces (e.g. Klarna only appears for SEK). Defaults to 'EUR'.
  @IsString()
  @IsOptional()
  currency?: string;

  // Affiliate code from a ?ref= link or typed at checkout. Unknown or
  // inactive codes are ignored rather than rejected.
  @IsString()
  @IsOptional()
  @MaxLength(64)
  affiliateCode?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}

export class UpdatePaymentStatusDto {
  @IsString()
  paymentStatus: string;
}

export class SelectCryptoCoinDto {
  // e.g. 'btc' or 'polygon/usdc' — one of the `path` values returned by
  // the crypto coin list in the checkout response.
  @IsString()
  coinPath: string;
}

