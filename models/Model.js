import mongoose, { Schema } from 'mongoose';

//appuser will be required.

const userSchema = new mongoose.Schema({
  appUser: {
    type: String
  },
  userPreferences: {
    attachment: {
            type: Boolean,
            default: false
        },
    priority: {
            type: Boolean,
            default: false
        },
    sla: {
            type: Boolean,
            default: false
        }
  },
  issues: [{
    type: Schema.Types.ObjectId,
    ref: 'IssueTab'
  }]
});

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
    issues: [{
      type: Schema.Types.ObjectId,
      ref: 'IssueTab'
    }]
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
    }],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

export const User = mongoose.model('User', userSchema);
export const IssueTab = mongoose.model('IssueTab', issueTabSchema);
export const Checkable = mongoose.model('Checkable', checkableSchema);