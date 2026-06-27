import mongoose,{
Schema,
Document,
} from "mongoose";

export interface IInstallment {

title:string;

percentage:number;

sequence:number;

}

export interface IPaymentPlan
extends Document{

projectId:mongoose.Types.ObjectId;

phaseId:mongoose.Types.ObjectId;

name:string;

description?:string;

installments:IInstallment[];

status:"active"|"inactive";

createdBy:mongoose.Types.ObjectId;

}

const InstallmentSchema=new Schema({

title:{
type:String,
required:true,
},

percentage:{
type:Number,
required:true,
},

sequence:{
type:Number,
required:true,
}

});

const PaymentPlanSchema=new Schema({

projectId:{
type:Schema.Types.ObjectId,
ref:"Project",
required:true,
},

phaseId:{
type:Schema.Types.ObjectId,
ref:"Phase",
required:true,
},

name:{
type:String,
required:true,
},

description:{
type:String,
default:"",
},

installments:{
type:[InstallmentSchema],
default:[]
},

status:{
type:String,
enum:["active","inactive"],
default:"active",
},

createdBy:{
type:Schema.Types.ObjectId,
ref:"User",
required:true,
}

},{
timestamps:true
});

export default mongoose.model<IPaymentPlan>(
"PaymentPlan",
PaymentPlanSchema
);