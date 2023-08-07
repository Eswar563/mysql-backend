// const bcrypt = require("bcrypt");
const db = require("../db");
const express = require("express");
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);
const { v4: uuidv4 } = require('uuid');
// const queryUtilities = require("../queryUtilities/queryUtilities")

//createBlog
exports.createBlog = async (req, res) => {
    const { title, summary, cover, published, author, category, content, post_slug } = req.body;
  
    const post_id = uuidv4();
  
    const newPost = {
      post_id,
      title,
      summary,
      cover,
      published,
      author,
      category,
      content,
      post_slug,
    };
  
    db.query('INSERT INTO posts SET ?,posted_at = NOW()', newPost, (error, results) => {
      if (error) {
        console.error('Error inserting post:', error);
        return res.status(500).json({ error: 'Failed to create post' });
      }
  
      return res.status(201).json({ message: 'Post created successfully', post_id });
    });
  };

//getAllBlogs
exports.getAllBlogs = async (req, res) => {
  db.query('SELECT * FROM posts', (error, results) => {
    if (error) {
      console.error('Error fetching blog posts:', error);
      return res.status(500).json({ error: 'Failed to fetch blog posts' });
    }

    return res.status(200).json({ blogPosts: results });
  });
};

//getBlog
exports.getBlog = async (req, res) => {
  const { postId } = req.params; 

  if (!postId) {
    return res.status(400).json({ error: 'post_id is required to get a blog post' });
  }

  db.query('SELECT * FROM posts WHERE id = ?', [postId], (error, results) => {
    if (error) {
      console.error('Error fetching post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = results[0];
    return res.status(200).json({ post });
  });
};

//updateBlog
exports.updateBlog = async (req, res) => {
const { title, summary, cover, published, author, category, posted_at, content, post_slug } = req.body;
const { postId } = req.params; 

if (!postId) {
  return res.status(400).json({ error: 'post_id is required for updating a post' });
}

const updatedPost = {
  title,
  summary,
  cover,
  published,
  author,
  category,
  posted_at,
  content,
  post_slug,
};

db.query('UPDATE posts SET ?,  posted_at = NOW() WHERE id = ?', [updatedPost, postId], (error, results) => {
  if (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ error: 'Failed to update post' });
  }

  if (results.affectedRows === 0) {
    return res.status(404).json({ error: 'Post not found' });
  }

  return res.status(200).json({ message: 'Post updated successfully' });
});
};

//deleteBlog
exports.deleteBlog = async (req, res) => {
  const { postId } = req.params;

  db.query('DELETE FROM posts WHERE id = ?', postId, (error, results) => {
    if (error) {
      console.error('Error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json({ message: 'Post deleted successfully', postId });
  });
};

//deleteAllBlogs
exports.deleteAllBlogs = async (req, res) => {
  db.query('DELETE FROM posts', (error, results) => {
    if (error) {
      console.error('Error deleting all posts:', error);
      return res.status(500).json({ error: 'Failed to delete all posts' });
    }

    const deletedCount = results.affectedRows;

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'No posts found to delete' });
    }

    return res.status(200).json({ message: 'All posts deleted successfully', deletedCount });
  });
};
