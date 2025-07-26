import mongoose, { Schema, Document } from "mongoose";

enum Role {
  User = "User",
  Vendor = "Vendor",
  Admin = "Admin",
}

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  storeName?: string;
  isApproved?: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(Role), default: Role.User },
  storeName: {
    type: String,
    required: function (this: IUser) {
      return this.role === Role.Vendor;
    },
  },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
