import mongoose, { Schema } from 'mongoose';

const checkableSchema = new mongoose.Schema({
    customId: {
        type:String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    issue: [{
            type:Schema.Types.ObjectId, 
            ref: 'IssueTab'
        }]
});


const issueTabSchema = new mongoose.Schema({
    issueId: String,
    fieldContent: [{
        value: String,
        status: {
            type: String,
            default: 'unchecked'
        }
    }],
    ownerField: {
        type: Schema.Types.ObjectId,
        ref: 'Checkable'
    }
});

export const IssueTab = mongoose.model('IssueTab', issueTabSchema);
export const Checkable = mongoose.model('Checkable', checkableSchema);