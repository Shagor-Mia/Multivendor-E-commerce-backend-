import mongoose, { Schema, Document } from "mongoose";

interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  discount: number;
  image?: {
    url: string;
    public_id: string;
  };
  vendor: mongoose.Types.ObjectId;
  productCode: string;
  category: mongoose.Types.ObjectId;
  averageRating: number;
  reviewCount: number;

  stock: number;
  status: "In Stock" | "Stock Out";
  readonly finalPrice: number; // readonly because it's derived
  createdAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
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
    vendor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productCode: { type: String, unique: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    status: { type: String, enum: ["In Stock", "Stock Out"], required: true },
    stock: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for final price
ProductSchema.virtual("finalPrice").get(function (this: IProduct) {
  return typeof this.price === "number"
    ? this.price - (this.price * (this.discount || 0)) / 100
    : 0;
});

// Auto-generate productCode before saving
ProductSchema.pre<IProduct>("save", async function (next) {
  if (!this.productCode) {
    const baseCode = this.name
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toUpperCase()
      .substring(0, 10);

    let code = baseCode;
    let counter = 0;

    while (await mongoose.models.Product.findOne({ productCode: code })) {
      counter++;
      code = `${baseCode}-${counter}`;
    }

    this.productCode = code;
  }
  next();
});

export default mongoose.model<IProduct>("Product", ProductSchema);
