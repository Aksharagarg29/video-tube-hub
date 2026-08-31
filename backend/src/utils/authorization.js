import { APIerror } from "./apiError.js";

export const requireOwner = (resource, userId, message = "Not authorized to modify this resource") => {
    if (!resource || resource.owner?.toString() !== userId?.toString()) {
        throw new APIerror(403, message);
    }
};
