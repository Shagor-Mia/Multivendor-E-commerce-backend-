import mongoose, { Schema, Document } from "mongoose";
import Product from "./Product";

interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
}

interface IShoppingCart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
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
  },
  { timestamps: true }
);

//  Auto-calculate total price before saving
ShoppingCartSchema.pre<IShoppingCart>("save", async function (next) {
  if (!this.isModified("items")) return next(); // Only recalc if items changed

  let total = 0;

  for (const item of this.items) {
    const product = await Product.findById(item.product).select("price");
    if (product) {
      total += product.price * item.quantity;
    }
  }

  this.totalPrice = total;
  next();
});

export default mongoose.model<IShoppingCart>(
  "ShoppingCart",
  ShoppingCartSchema
);
