import { Request, Response } from 'express';
import { getAsync, allAsync, runAsync } from '../db';
import fs from 'fs';
import path from 'path';

// Get all discussions with filters
export const getDiscussions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, sort, search, page = 1, limit = 10 } = req.query;
    const offset = ((Number(page) || 1) - 1) * (Number(limit) || 10);
    
    // Build query conditions
    let conditions = '';
    const queryParams: any[] = [];
    
    if (category) {
      conditions += ' AND d.category = ?';
      queryParams.push(category);
    }
    
    if (search) {
      conditions += ' AND (d.title LIKE ? OR d.content LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Determine sort order
    let sortOrder = '';
    if (sort === 'popular') {
      sortOrder = 'ORDER BY d.votes_up - d.votes_down DESC, d.created_at DESC';
    } else if (sort === 'comments') {
      sortOrder = 'ORDER BY comment_count DESC, d.created_at DESC';
    } else {
      // Default sort by newest
      sortOrder = 'ORDER BY d.created_at DESC';
    }
    
    // Get discussions
    const discussions = await allAsync(
      `SELECT 
        d.id, d.title, d.content, d.category, d.created_at, d.updated_at, 
        d.creator_id, d.votes_up, d.votes_down, d.image_url,
        u.username, u.profile_image,
        COUNT(DISTINCT c.id) as comment_count
      FROM discussions d
      JOIN users u ON d.creator_id = u.id
      LEFT JOIN comments c ON d.id = c.discussion_id
      WHERE 1=1 ${conditions}
      GROUP BY d.id
      ${sortOrder}
      LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit) || 10, offset]
    );
    
    // Get total count for pagination
    const countResult = await getAsync(
      `SELECT COUNT(*) as total FROM discussions d WHERE 1=1 ${conditions}`,
      [...queryParams]
    );
    
    res.status(200).json({
      discussions,
      pagination: {
        total: countResult.total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        pages: Math.ceil(countResult.total / (Number(limit) || 10))
      }
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({ message: 'Server error fetching discussions' });
  }
};

// Get a single discussion by ID
export const getDiscussionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Optional: user might not be logged in
    
    // Get discussion details
    const discussion = await getAsync(
      `SELECT 
        d.id, d.title, d.content, d.category, d.created_at, d.updated_at, 
        d.creator_id, d.votes_up, d.votes_down, d.image_url,
        u.username, u.profile_image,
        (SELECT COUNT(*) FROM comments WHERE discussion_id = d.id) as comment_count
      FROM discussions d
      JOIN users u ON d.creator_id = u.id
      WHERE d.id = ?`,
      [id]
    );
    
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }
    
    // Get user's vote if logged in
    let userVote = null;
    if (userId) {
      const vote = await getAsync(
        'SELECT vote_type FROM discussion_votes WHERE discussion_id = ? AND user_id = ?',
        [id, userId]
      );
      userVote = vote ? vote.vote_type : null;
    }
    
    // Get all comments with user details and votes
    const comments = await allAsync(
      `SELECT 
        c.id, c.content, c.created_at, c.parent_comment_id, c.thumbs_up, c.thumbs_down,
        u.id as user_id, u.username, u.profile_image,
        (SELECT vote_type FROM comment_votes WHERE comment_id = c.id AND user_id = ?) as user_vote
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.discussion_id = ?
      ORDER BY c.created_at DESC`,
      [userId || null, id]
    );
    
    res.status(200).json({
      discussion: {
        ...discussion,
        user_vote: userVote
      },
      comments
    });
  } catch (error) {
    console.error('Get discussion by ID error:', error);
    res.status(500).json({ message: 'Server error fetching discussion' });
  }
};

// Create a new discussion
export const createDiscussion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, category, image_url } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!title || !content || !category) {
      res.status(400).json({ message: 'Title, content and category are required' });
      return;
    }
    
    // Insert the discussion
    const result = await runAsync(
      `INSERT INTO discussions (
        title, content, category, creator_id, image_url, votes_up, votes_down
      ) VALUES (?, ?, ?, ?, ?, 0, 0)`,
      [title, content, category, userId, image_url || null]
    );
    
    // Get the created discussion
    const discussion = await getAsync(
      `SELECT 
        d.id, d.title, d.content, d.category, d.created_at, d.updated_at, 
        d.creator_id, d.votes_up, d.votes_down, d.image_url,
        u.username, u.profile_image
      FROM discussions d
      JOIN users u ON d.creator_id = u.id
      WHERE d.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json({
      message: 'Discussion created successfully',
      discussion
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ message: 'Server error creating discussion' });
  }
};

// Update a discussion
export const updateDiscussion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.id;
    
    // Check if discussion exists and belongs to user
    const discussion = await getAsync(
      'SELECT id, creator_id FROM discussions WHERE id = ?',
      [id]
    );
    
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }
    
    // Check if user is creator
    if (discussion.creator_id !== userId) {
      res.status(403).json({ message: 'Not authorized to update this discussion' });
      return;
    }
    
    // Update fields
    const updates: any = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (category) updates.category = category;
    
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    
    // Build update query
    const setStatements = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const queryParams = [...Object.values(updates), id];
    
    await runAsync(
      `UPDATE discussions SET ${setStatements}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      queryParams
    );
    
    // Get updated discussion
    const updatedDiscussion = await getAsync(
      `SELECT 
        d.id, d.title, d.content, d.category, d.created_at, d.updated_at, 
        d.creator_id, d.votes_up, d.votes_down, d.image_url,
        u.username, u.profile_image
      FROM discussions d
      JOIN users u ON d.creator_id = u.id
      WHERE d.id = ?`,
      [id]
    );
    
    res.status(200).json({
      message: 'Discussion updated successfully',
      discussion: updatedDiscussion
    });
  } catch (error) {
    console.error('Update discussion error:', error);
    res.status(500).json({ message: 'Server error updating discussion' });
  }
};

// Delete a discussion
export const deleteDiscussion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if discussion exists and belongs to user
    const discussion = await getAsync(
      'SELECT id, creator_id, image_url FROM discussions WHERE id = ?',
      [id]
    );
    
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }
    
    // Check if user is creator
    if (discussion.creator_id !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this discussion' });
      return;
    }
    
    // Start a transaction
    await runAsync('BEGIN TRANSACTION');
    
    try {
      // Delete all comment votes
      await runAsync(
        'DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE discussion_id = ?)',
        [id]
      );
      
      // Delete all comments
      await runAsync('DELETE FROM comments WHERE discussion_id = ?', [id]);
      
      // Delete all discussion votes
      await runAsync('DELETE FROM discussion_votes WHERE discussion_id = ?', [id]);
      
      // Delete the discussion
      await runAsync('DELETE FROM discussions WHERE id = ?', [id]);
      
      // If there was an image, delete the file
      if (discussion.image_url) {
        const imagePath = path.resolve(__dirname, '../../../uploads', path.basename(discussion.image_url));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      
      // Commit transaction
      await runAsync('COMMIT');
      
      res.status(200).json({ message: 'Discussion deleted successfully' });
    } catch (error) {
      // Rollback on error
      await runAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({ message: 'Server error deleting discussion' });
  }
};

// Add a comment to a discussion
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;
    
    // Validate content
    if (!content) {
      res.status(400).json({ message: 'Comment content is required' });
      return;
    }
    
    // Check if discussion exists
    const discussion = await getAsync('SELECT id FROM discussions WHERE id = ?', [id]);
    
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }
    
    // If parentCommentId is provided, check if it exists and belongs to this discussion
    if (parentCommentId) {
      const parentComment = await getAsync(
        'SELECT id FROM comments WHERE id = ? AND discussion_id = ?',
        [parentCommentId, id]
      );
      
      if (!parentComment) {
        res.status(404).json({ message: 'Parent comment not found' });
        return;
      }
    }
    
    // Add comment
    const result = await runAsync(
      'INSERT INTO comments (discussion_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)',
      [id, userId, content, parentCommentId || null]
    );
    
    // Get comment with user details
    const comment = await getAsync(
      `SELECT c.id, c.content, c.created_at, c.parent_comment_id, c.thumbs_up, c.thumbs_down,
        u.id as user_id, u.username, u.profile_image,
        NULL as user_vote
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.lastID]
    );
    
    res.status(201).json({
      message: 'Comment added',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
};

// Delete a comment from a discussion
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.id;
    
    // Check if comment exists and belongs to user or is discussion creator
    const comment = await getAsync(
      `SELECT c.id, c.user_id, d.creator_id
       FROM comments c
       JOIN discussions d ON c.discussion_id = d.id
       WHERE c.id = ? AND c.discussion_id = ?`,
      [commentId, id]
    );
    
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    
    // Check if user is comment owner or discussion creator
    if (comment.user_id !== userId && comment.creator_id !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this comment' });
      return;
    }
    
    // Start a transaction
    await runAsync('BEGIN TRANSACTION');
    
    try {
      // First, recursively delete all child comments (replies to this comment)
      const deleteReplies = async (parentCommentId: string) => {
        // Find all replies to this comment
        const replies = await allAsync(
          'SELECT id FROM comments WHERE parent_comment_id = ?',
          [parentCommentId]
        );
        
        // For each reply, recursively delete its replies first
        for (const reply of replies) {
          await deleteReplies(reply.id.toString());
        }
        
        // Delete all votes for these comments
        await runAsync(
          'DELETE FROM comment_votes WHERE comment_id IN (SELECT id FROM comments WHERE parent_comment_id = ?)',
          [parentCommentId]
        );
        
        // Then delete all replies to this comment
        await runAsync(
          'DELETE FROM comments WHERE parent_comment_id = ?',
          [parentCommentId]
        );
      };
      
      // First delete all nested replies
      await deleteReplies(commentId);
      
      // Delete votes for this comment
      await runAsync('DELETE FROM comment_votes WHERE comment_id = ?', [commentId]);
      
      // Finally delete the comment itself
      await runAsync('DELETE FROM comments WHERE id = ?', [commentId]);
      
      // Commit the transaction
      await runAsync('COMMIT');
      
      res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
      // Rollback on error
      await runAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
};

// Vote on a comment
export const voteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.id;
    const { voteType } = req.body;
    
    if (!voteType || (voteType !== 'up' && voteType !== 'down')) {
      res.status(400).json({ message: 'Vote type must be "up" or "down"' });
      return;
    }
    
    // Check if comment exists and belongs to the discussion
    const comment = await getAsync(
      'SELECT id, thumbs_up, thumbs_down FROM comments WHERE id = ? AND discussion_id = ?',
      [commentId, id]
    );
    
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    
    // Check if user has already voted on this comment
    const existingVote = await getAsync(
      'SELECT vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );
    
    // Start a transaction
    await runAsync('BEGIN TRANSACTION');
    
    try {
      let newThumbsUp = comment.thumbs_up;
      let newThumbsDown = comment.thumbs_down;
      
      if (existingVote) {
        // User is changing their vote
        if (existingVote.vote_type !== voteType) {
          // Update the vote type
          await runAsync(
            'UPDATE comment_votes SET vote_type = ? WHERE comment_id = ? AND user_id = ?',
            [voteType, commentId, userId]
          );
          
          // Adjust the counters
          if (voteType === 'up') {
            newThumbsUp += 1;
            newThumbsDown -= 1;
          } else {
            newThumbsUp -= 1;
            newThumbsDown += 1;
          }
        } else {
          // User is removing their vote
          await runAsync(
            'DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
          );
          
          // Adjust the counters
          if (voteType === 'up') {
            newThumbsUp -= 1;
          } else {
            newThumbsDown -= 1;
          }
        }
      } else {
        // User is adding a new vote
        await runAsync(
          'INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES (?, ?, ?)',
          [commentId, userId, voteType]
        );
        
        // Adjust the counters
        if (voteType === 'up') {
          newThumbsUp += 1;
        } else {
          newThumbsDown += 1;
        }
      }
      
      // Update the comment with new vote counts
      await runAsync(
        'UPDATE comments SET thumbs_up = ?, thumbs_down = ? WHERE id = ?',
        [newThumbsUp, newThumbsDown, commentId]
      );
      
      // Commit the transaction
      await runAsync('COMMIT');
      
      // Return the updated comment with the user's vote
      res.status(200).json({
        message: 'Vote recorded',
        comment: {
          thumbs_up: newThumbsUp,
          thumbs_down: newThumbsDown,
          user_vote: existingVote?.vote_type === voteType ? null : voteType
        }
      });
    } catch (error) {
      // Rollback on error
      await runAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Vote comment error:', error);
    res.status(500).json({ message: 'Server error voting on comment' });
  }
};

// Vote on a discussion
export const voteDiscussion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { voteType } = req.body;
    
    if (!voteType || (voteType !== 'up' && voteType !== 'down')) {
      res.status(400).json({ message: 'Vote type must be "up" or "down"' });
      return;
    }
    
    // Check if discussion exists
    const discussion = await getAsync(
      'SELECT id, votes_up, votes_down FROM discussions WHERE id = ?',
      [id]
    );
    
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }
    
    // Check if user has already voted on this discussion
    const existingVote = await getAsync(
      'SELECT vote_type FROM discussion_votes WHERE discussion_id = ? AND user_id = ?',
      [id, userId]
    );
    
    // Start a transaction
    await runAsync('BEGIN TRANSACTION');
    
    try {
      let newVotesUp = discussion.votes_up;
      let newVotesDown = discussion.votes_down;
      
      if (existingVote) {
        // User is changing their vote
        if (existingVote.vote_type !== voteType) {
          // Update the vote type
          await runAsync(
            'UPDATE discussion_votes SET vote_type = ? WHERE discussion_id = ? AND user_id = ?',
            [voteType, id, userId]
          );
          
          // Adjust the counters
          if (voteType === 'up') {
            newVotesUp += 1;
            newVotesDown -= 1;
          } else {
            newVotesUp -= 1;
            newVotesDown += 1;
          }
        } else {
          // User is removing their vote
          await runAsync(
            'DELETE FROM discussion_votes WHERE discussion_id = ? AND user_id = ?',
            [id, userId]
          );
          
          // Adjust the counters
          if (voteType === 'up') {
            newVotesUp -= 1;
          } else {
            newVotesDown -= 1;
          }
        }
      } else {
        // User is adding a new vote
        await runAsync(
          'INSERT INTO discussion_votes (discussion_id, user_id, vote_type) VALUES (?, ?, ?)',
          [id, userId, voteType]
        );
        
        // Adjust the counters
        if (voteType === 'up') {
          newVotesUp += 1;
        } else {
          newVotesDown += 1;
        }
      }
      
      // Update the discussion with new vote counts
      await runAsync(
        'UPDATE discussions SET votes_up = ?, votes_down = ? WHERE id = ?',
        [newVotesUp, newVotesDown, id]
      );
      
      // Commit the transaction
      await runAsync('COMMIT');
      
      // Return the updated discussion with the user's vote
      res.status(200).json({
        message: 'Vote recorded',
        discussion: {
          votes_up: newVotesUp,
          votes_down: newVotesDown,
          user_vote: existingVote?.vote_type === voteType ? null : voteType
        }
      });
    } catch (error) {
      // Rollback on error
      await runAsync('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Vote discussion error:', error);
    res.status(500).json({ message: 'Server error voting on discussion' });
  }
};

// Upload an image for a discussion
export const uploadDiscussionImage = async (req: Request & { file?: any }, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!req.file) {
      res.status(400).json({ message: 'No image uploaded' });
      return;
    }
    
    // Check if discussion exists and belongs to user
    const discussion = await getAsync(
      'SELECT id, creator_id, image_url FROM discussions WHERE id = ?',
      [id]
    );
    
    if (!discussion) {
      res.status(404).json({ message: 'Discussion not found' });
      return;
    }
    
    if (discussion.creator_id !== userId) {
      res.status(403).json({ message: 'Not authorized to update this discussion' });
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return;
    }
    
    // Delete old image if it exists
    if (discussion.image_url) {
      const oldImagePath = path.resolve(__dirname, '../../../uploads', path.basename(discussion.image_url));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update the discussion with the new image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    await runAsync(
      'UPDATE discussions SET image_url = ? WHERE id = ?',
      [imageUrl, id]
    );
    
    res.status(200).json({
      message: 'Image uploaded successfully',
      discussion: {
        ...discussion,
        image_url: imageUrl
      }
    });
  } catch (error) {
    // Delete the uploaded file in case of an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Upload discussion image error:', error);
    res.status(500).json({ message: 'Server error uploading image' });
  }
}; 