import type { RequestHandler } from "express";
import type { z } from "zod";

const validate = <Schema extends z.ZodType>(schema: Schema): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues,
      });
    }

    next();
  };
};

export default validate;
