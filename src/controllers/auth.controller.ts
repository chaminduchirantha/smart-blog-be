import { Request, Response } from "express"
import { IUser, Role, Status, User } from "../models/User"
import bcrypt from "bcryptjs"
import { signAccessToken, signRefreshTokn } from "../utils/tokens"
import { AuthRequest } from "../middleware/auth"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const register = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, password, role } = req.body

    // data validation
    if (!firstname || !lastname || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (role !== Role.USER && role !== Role.AUTHOR) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email alrady registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const approvalStatus =
      role === Role.AUTHOR ? Status.PENDING : Status.APPROVED

    const newUser = new User({
      firstname, // firstname: firstname
      lastname,
      email,
      password: hashedPassword,
      roles: [role],
      approved: approvalStatus
    })

    await newUser.save()

    res.status(201).json({
      message:
        role === Role.AUTHOR
          ? "Author registered successfully. waiting for approvel"
          : "User registered successfully",
      data: {
        id: newUser._id,
        email: newUser.email,
        roles: newUser.roles,
        approved: newUser.approved
      }
    })
  } catch (err: any) {
    res.status(500).json({ message: err?.message })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, existingUser.password)
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const accessToken = signAccessToken(existingUser)
    const refreshToken = signRefreshTokn(existingUser)

    res.status(200).json({
      message: "success",
      data: {
        email: existingUser.email,
        roles: existingUser.roles,
        accessToken,
        refreshToken
      }
    })
  } catch (err: any) {
    res.status(500).json({ message: err?.message })
  }
}

export const getMyDetails = async (req: AuthRequest, res: Response) => {
  // const roles = req.user.roles
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  const userId = req.user.sub
  const user =
    ((await User.findById(userId).select("-password")) as IUser) || null

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    })
  }

  const { firstname, lastname, email, roles, approved } = user

  res.status(200).json({
    message: "Ok",
    data: { firstname, lastname, email, roles, approved }
  })
}

export const registerAdmin = (req: Request, res: Response) => {}


export const handelRefreshToken =async (req: Request, res: Response) =>{
    try{
      const {token} = req.body
      if(!token){
        return res.status(400).json({ message: "Token Requird" })
      }

      const payload = jwt.verify(token,JWT_REFRESH_SECRET)

      const user =await User.findById(payload.sub)

      if(!user){
        return res.status(403).json({ message: "Invalid Refresh Token" })
      }

      const accessToken = signAccessToken(user)
      res.status(200).json({accessToken})

    }catch(err){
       res.status(403).json({ message: "Invalid or Expire Token"})
    }
}


