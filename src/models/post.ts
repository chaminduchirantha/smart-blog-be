import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document{
 _id : mongoose.Types.ObjectId
 title : string,
 content : string
 tags : string[]
 imageUrl : string
 auther :mongoose.Types.ObjectId
 creatAt? : Date
 updatedAt? : Date
}

const postSchema = new Schema<IPost>({
    title:{type:String , required:true},
    content:{type:String , required:true},
    tags : [{type:String }],
    imageUrl : {type:String},
    auther : {type:Schema.ObjectId ,ref:"User" , required:true}
},{
    timestamps:true
})


export const Post = mongoose.model<IPost>("Post", postSchema)