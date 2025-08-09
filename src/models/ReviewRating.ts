import mongoose, { Schema, Document, Model } from "mongoose";
import Product from "./Product";

interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IReviewModel extends Model<IReview> {
  calculateAverageRating(productId: mongoose.Types.ObjectId): Promise<void>;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to calculate average rating and review count for a product
ReviewSchema.statics.calculateAverageRating = async function (
  productId: mongoose.Types.ObjectId
) {
  const result = await this.aggregate([
    { $match: { product: productId } },
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
      // No reviews - reset fields
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        reviewCount: 0,
      });
    }
  } catch (error) {
    console.error("Error updating product average rating:", error);
  }
};

// After save hook
ReviewSchema.post("save", async function () {
  try {
    await (this.constructor as IReviewModel).calculateAverageRating(
      this.product
    );
  } catch (error) {
    console.error("Failed to update average rating after save:", error);
  }
});

// After update hook (for findOneAndUpdate)
ReviewSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    try {
      await (doc.constructor as IReviewModel).calculateAverageRating(
        doc.product
      );
    } catch (error) {
      console.error("Failed to update average rating after update:", error);
    }
  }
});

// After delete hook (for findOneAndDelete)
ReviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      await (doc.constructor as IReviewModel).calculateAverageRating(
        doc.product
      );
    } catch (error) {
      console.error("Failed to update average rating after delete:", error);
    }
  }
});

export default mongoose.model<IReview, IReviewModel>("Review", ReviewSchema);
