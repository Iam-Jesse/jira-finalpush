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
    }
});


const issueTabSchema = new mongoose.Schema({
    issueId: {
        type: String
    },
    fieldContent: [{
        value: String,
        status: {
            type: Boolean,
            default: false
        }
    }],
    ownerField: {
        type: Schema.Types.ObjectId,
        ref: 'Checkable'
    },
    ownerTitle: String,
    approvalRequest: {
        type: Boolean,
        default: false
    },
    editor: [
        {
            timestamp: Number,
            userId: String,
            email: String,
            displayName: String  
        }
    ],
    approver: [{
        timestamp: Number,
        userId: String,
        email: String,
        displayName: String
    }]
});

export const IssueTab = mongoose.model('IssueTab', issueTabSchema);
export const Checkable = mongoose.model('Checkable', checkableSchema);