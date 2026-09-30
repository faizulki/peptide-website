import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Cart } from '../entities/cart.entity';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private formatCart(cart: Cart) {
    return {
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              nameSv: item.product.nameSv,
              price: item.product.price,
              image: item.product.image,
              inStock: item.product.inStock,
            }
          : null,
      })),
      userId: cart.userId,
      guestId: cart.guestId,
    };
  }

  @Get()
  async getCart(@Request() req: any, @Query('guestId') guestId?: string) {
    const userId = req.user?.id;
    const cart = await this.cartService.getCart(userId, guestId);
    return this.formatCart(cart);
  }

  @Post('add')
  async addToCart(@Request() req: any, @Body() addToCartDto: AddToCartDto, @Query('guestId') guestId?: string) {
    const userId = req.user?.id;
    const cart = await this.cartService.addToCart(addToCartDto, userId, guestId);
    return this.formatCart(cart);
  }

  @Patch('items/:productId')
  async updateCartItem(
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Request() req: any,
    @Query('guestId') guestId?: string,
  ) {
    const userId = req.user?.id;
    const cart = await this.cartService.updateCartItem(productId, updateCartItemDto, userId, guestId);
    return this.formatCart(cart);
  }

  @Delete('items/:productId')
  async removeFromCart(
    @Param('productId') productId: string,
    @Request() req: any,
    @Query('guestId') guestId?: string,
  ) {
    const userId = req.user?.id;
    const cart = await this.cartService.removeFromCart(productId, userId, guestId);
    return this.formatCart(cart);
  }

  @Delete('clear')
  async clearCart(@Request() req, @Query('guestId') guestId?: string) {
    const userId = req.user?.id;
    await this.cartService.clearCart(userId, guestId);
    return { items: [] };
  }
}
