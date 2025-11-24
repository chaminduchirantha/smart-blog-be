import { Request, Response } from "express"

import cloudinery from '../config/cloudinerity'
import { error } from "console"
import { Post } from "../models/post"
import { User } from "../models/User"
import { AuthRequest } from "../middleware/auth"



export const create =async (req: AuthRequest, res: Response) => {
     try {

        const{title, content, tags} = req.body

        // if (!authHeader) {
        //     return res.status(401).json({ message: "No token provided" })
        // }

        let imageUrl = ""

        if (req.file) {
            const result: any = await new Promise((resolve, reject) => {
                const upload_stream = cloudinery.uploader.upload_stream(
                    {folder: "post"},
                    (err, result) => {
                        if (err) return reject(err)
                        resolve(result)
                    }
                )

                upload_stream.end(req.file?.buffer)

            })
            imageUrl  = result.secure_url
        }

        const newPost = new Post({
            title,
            content,
            tags: tags.split(","),  //"mobile,smartphone -> ["mobile", "smartphone"]"
            imageUrl,
            auther: req.user?.sub ///userId from auth middleware
        })

        await newPost.save()
        res.status(201).json({message: "Post created",
            data: newPost
        })

        
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Fail to save post"} )
    }


} 

export const view = async(req: Request, res: Response) => {
     try {
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('auther', 'firstName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();
    return res.status(200).json({
      message: 'Posts data',
      data: posts,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get post.!' });
  }

}

export const getMe =async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        // Pagination
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const skip = (page - 1) * limit

        // Find posts created by the logged-in user
        const myPosts = await Post.find({ author: req.user.sub })
            .populate('auther', 'firstName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        const total = await Post.countDocuments({ author: req.user.sub })

        return res.status(200).json({
            message: "My posts fetched successfully",
            data: myPosts,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            page
        });

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Failed to get your posts." })
    }
}