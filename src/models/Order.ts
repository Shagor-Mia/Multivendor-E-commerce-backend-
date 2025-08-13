// models/Order.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // snapshot price
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  paymentIntentId?: string;
  paymentStatus: "unpaid" | "processing" | "paid" | "failed";
  shippingAddress: IAddress;
  billingAddress: IAddress;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema: Schema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
});

const OrderItemSchema: Schema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
    },
    paymentIntentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "paid", "failed"],
      default: "unpaid",
    },
    shippingAddress: { type: AddressSchema, required: true },
    billingAddress: { type: AddressSchema, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
