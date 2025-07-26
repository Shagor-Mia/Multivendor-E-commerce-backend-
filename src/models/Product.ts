import mongoose, { Schema, Document } from 'mongoose';

interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  vendor: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  stock: number;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  stock: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IProduct>('Product', ProductSchema);