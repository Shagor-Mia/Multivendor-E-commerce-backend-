import mongoose, { Schema, Document, Model } from "mongoose";
import Product from "./Product";

interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  rating?: number; // optional
  review?: string; // optional
  createdAt: Date;
  updatedAt: Date;
}

interface IReviewModel extends Model<IReview> {
  calculateAverageRating(productId: mongoose.Types.ObjectId): Promise<void>;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, trim: true },
  },
  { timestamps: true }
);

// Unique one review per user per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method for average rating
ReviewSchema.statics.calculateAverageRating = async function (
  productId: mongoose.Types.ObjectId
) {
  const result = await this.aggregate([
    { $match: { product: productId, rating: { $ne: null } } }, // only consider reviews with rating
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  try {
    if (result.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: result[0].averageRating,
        reviewCount: result[0].reviewCount,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        reviewCount: 0,
      });
    }
  } catch (error) {
    console.error("Error updating product average rating:", error);
  }
};

// Hooks for recalculating rating
ReviewSchema.post("save", async function () {
  try {
    await (this.constructor as IReviewModel).calculateAverageRating(
      this.product
    );
  } catch (err) {
    console.error(err);
  }
});

ReviewSchema.post("findOneAndUpdate", async function (doc: IReview | null) {
  if (doc) {
    await (doc.constructor as IReviewModel).calculateAverageRating(doc.product);
  }
});

ReviewSchema.post("findOneAndDelete", async function (doc: IReview | null) {
  if (doc) {
    await (doc.constructor as IReviewModel).calculateAverageRating(doc.product);
  }
});

export default mongoose.model<IReview, IReviewModel>("Review", ReviewSchema);
