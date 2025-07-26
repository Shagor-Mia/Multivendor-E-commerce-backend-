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
  resetPasswordOtp?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
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
  isApproved: { type: Boolean, default: false }, // Only for Vendors, true if approved
  resetPasswordOtp: { type: String }, // OTP for password reset
  resetPasswordExpires: { type: Date }, // Expiry for OTP
  lastLogin: { type: Date }, // Last login timestamp
  createdAt: { type: Date, default: Date.now },
});

// You might also want a pre-save hook for password hashing
// UserSchema.pre('save', async function (next) {
//     if (this.isModified('password')) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }
//     next();
// });

export default mongoose.model<IUser>("User", UserSchema);
