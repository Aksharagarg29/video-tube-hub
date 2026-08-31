import mongoose from "mongoose";
import { APIerror } from "./apiError.js";

export const requireObjectId = (value, fieldName) => {
    if (!mongoose.isValidObjectId(value)) throw new APIerror(400, `Invalid or missing ${fieldName}`);
    return new mongoose.Types.ObjectId(value);
};

export const getPagination = (query) => {
    const page = Number.parseInt(query.page, 10) || 1;
    const limit = Number.parseInt(query.limit, 10) || 10;
    return { page: Math.max(page, 1), limit: Math.min(Math.max(limit, 1), 100) };
};
