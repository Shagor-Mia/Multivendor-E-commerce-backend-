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
  image?: {
    url: string;
    public_id: string;
  };
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
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: Object.values(Role),
    default: Role.User,
    required: true,
  },
  image: {
    url: {
      type: String,
      default:
        "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/defaults/avatar.png", // 🔁 Replace with your actual Cloudinary default image
    },
    public_id: {
      type: String,
      default: "",
    },
  },
  storeName: {
    type: String,
    required: function (this: IUser) {
      return this.role === Role.Vendor;
    },
  },
  isApproved: { type: Boolean, default: false },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Optional: Pre-save password hashing (you can enable if not doing it in controller)
// UserSchema.pre("save", async function (next) {
//   if (this.isModified("password")) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

export default mongoose.model<IUser>("User", UserSchema);
