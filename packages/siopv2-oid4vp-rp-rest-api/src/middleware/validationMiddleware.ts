import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateData = (schema: z.ZodObject<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue: any) => ({
          message: `${issue.path.join('.')} is ${issue.message}`,
        }))
        res.status(400).json({ status: 400, message: 'Invalid data', error_details: errorMessages[0].message });
      } else {
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
      }
    }
  };
}
