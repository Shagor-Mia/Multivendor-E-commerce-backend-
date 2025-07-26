import mongoose, { Schema, Document } from 'mongoose';

interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  amount: number;
  stripePaymentId: string;
  status: string;
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  stripePaymentId: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);