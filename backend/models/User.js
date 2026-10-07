import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    isDisabled: {type: Boolean, default: false},
    password: {type: String, required: true},
    role: {type: String, enum: ["ADMIN", "EMPLOYEE"], default: "EMPLOYEE"},
}, {timestamps: true});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;