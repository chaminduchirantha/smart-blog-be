import { Router } from "express";
import { create, getMe, view } from "../controllers/post.controller";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { Role } from "../models/User";
import { upload } from "../middleware/upload";
import { generateAi } from "../controllers/ai.controller";


const router = Router()

router.post('/create' ,
    authenticate, 
    requireRole([Role.ADMIN , Role.AUTHOR]), 
    upload.single("image"), 
    create
)

router.post("/ai/generate" , generateAi)


router.get('/' , view)
router.get('/me', authenticate, requireRole([Role.ADMIN , Role.AUTHOR]) ,getMe )

export default router