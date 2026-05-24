import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false
    },
    age: {
      type: Number,
      min: 10,
      max: 120,
      default: null
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ""
    },
    profilePic: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    age: this.age,
    location: this.location,
    profilePic: this.profilePic,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.model("User", userSchema);

export default User;
