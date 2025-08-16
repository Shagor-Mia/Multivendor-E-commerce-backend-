import mongoose, { Schema, Document } from "mongoose";

interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IShoppingCart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  itemsCount: number;
  totalPrice: number;
  updatedAt: Date;
  createdAt: Date;
}

const CartItemSchema: Schema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const ShoppingCartSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    itemsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IShoppingCart>(
  "ShoppingCart",
  ShoppingCartSchema
);
